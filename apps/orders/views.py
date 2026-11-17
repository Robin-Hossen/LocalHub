from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError


from apps.emails.services import (
    send_order_confirmation_email,
    send_order_processing_email,
    send_order_shipped_email,
)

from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from apps.orders.models import Order, OrderItem
from apps.orders.serializers import (
    OrderCreateSerializer,
    CustomerOrderSerializer,
    StaffOrderSerializer,
    StaffOrderStatusUpdateSerializer,
)
from apps.orders.permissions import IsCustomer, IsAdminOrOperations
from apps.orders.services import create_order, cancel_order

from apps.inventory.services import consume_reserved_stock

from apps.audit_logs.models import AuditLog
from apps.audit_logs.services import create_audit_log


# Customer APIs

class CustomerOrderCreateAPIView(generics.GenericAPIView):

    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = create_order(
                customer=request.user,
                address_id=serializer.validated_data['address_id'],
                items_data=serializer.validated_data['items'],
                notes=serializer.validated_data.get('notes', '')
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        response_serializer = CustomerOrderSerializer(order)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class CustomerOrderListAPIView(generics.ListAPIView):

    serializer_class = CustomerOrderSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    def get_queryset(self):

        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()

        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related('items')


class CustomerOrderDetailAPIView(generics.RetrieveAPIView):

    serializer_class = CustomerOrderSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related('items')


# Staff APIs


class StaffOrderListAPIView(generics.ListAPIView):

    serializer_class = StaffOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get_queryset(self):

        queryset = (
            Order.objects.select_related("customer", "vendor", "delivery_address")
            .prefetch_related("items")
            .order_by("-created_at")
        )

        order_status = self.request.query_params.get("status")

        if order_status:
            queryset = queryset.filter(status=order_status)

        return queryset


class StaffOrderDetailAPIView(generics.RetrieveAPIView):

    serializer_class = StaffOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    queryset = Order.objects.select_related(
        'customer',
        'vendor',
        'delivery_address'
    ).prefetch_related(
        'items'
    )


# Customer Order Cancellation

class CustomerOrderCancelAPIView(generics.GenericAPIView):

    serializer_class = CustomerOrderSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    @transaction.atomic
    def post(self, request, pk):

        order = get_object_or_404(
            Order.objects.select_for_update(),
            id=pk,
            customer=request.user
        )

        old_status = order.status

        try:
            cancelled_order = cancel_order(
                order_id=order.id,
                cancelled_by=request.user
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        create_audit_log(
            user=request.user,
            action=AuditLog.Action.STATUS_CHANGE,
            model_name=cancelled_order._meta.label,
            object_id=cancelled_order.pk,
            description=(
                f'Order {cancelled_order.order_number} '
                f'cancelled by customer'
            ),
            old_values={
                'status': old_status,
            },
            new_values={
                'status': cancelled_order.status,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(
            CustomerOrderSerializer(cancelled_order).data,
            status=status.HTTP_200_OK
        )


# Staff Order Status Update

class StaffOrderStatusUpdateAPIView(generics.GenericAPIView):

    serializer_class = StaffOrderStatusUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    @transaction.atomic
    def patch(self, request, pk):

        order = get_object_or_404(
            Order.objects.select_for_update(),
            id=pk
        )

        serializer = self.get_serializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)

        old_status = order.status
        new_status = serializer.validated_data['status']

        if new_status == Order.Status.DELIVERED:

            order_items = OrderItem.objects.select_for_update().filter(
                order=order,
                reserved_quantity__gt=0
            ).select_related('product').order_by('id')

            for item in order_items:

                quantity = item.reserved_quantity

                consume_reserved_stock(
                    product=item.product,
                    quantity=quantity,
                    created_by=request.user,
                    reference=order.order_number,
                    notes=f'Order delivered: {order.order_number}'
                )

                item.reserved_quantity = 0
                item.save(update_fields=['reserved_quantity'])

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        if (
            old_status != Order.Status.CONFIRMED
            and new_status == Order.Status.CONFIRMED
        ):
            transaction.on_commit(
                lambda: send_order_confirmation_email(order),
                robust=True,
            )
        if (
            old_status != Order.Status.PROCESSING
            and new_status == Order.Status.PROCESSING
        ):
            transaction.on_commit(
                lambda: send_order_processing_email(order),
                robust=True,
            )  
        if (
            old_status != Order.Status.SHIPPED
            and new_status == Order.Status.SHIPPED
        ):
            transaction.on_commit(
                lambda: send_order_shipped_email(order),
                robust=True,
            )      

        create_audit_log(
            user=request.user,
            action=AuditLog.Action.STATUS_CHANGE,
            model_name=order._meta.label,
            object_id=order.pk,
            description=(
                f'Order {order.order_number} status changed '
                f'from {old_status} to {new_status}'
            ),
            old_values={
                'status': old_status,
            },
            new_values={
                'status': new_status,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(
            StaffOrderSerializer(order).data,
            status=status.HTTP_200_OK
        )
