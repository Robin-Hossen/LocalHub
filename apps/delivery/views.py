from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models import Q, Count, Prefetch
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import status
from django.utils import timezone

from apps.delivery.models import (
    Delivery,
    DeliveryAssignmentHistory,
    DutySession,
)


from apps.delivery.permissions import (
    IsAdminOrOperations,
    IsDeliveryStaff,
)
from apps.delivery.serializers import (
    DeliveryAssignmentSerializer,
    DeliveryAssignmentDetailSerializer,
    DeliveryAssignmentHistorySerializer,
    DeliveryStatusUpdateSerializer,
    DeliveryReassignSerializer,
    MyDeliverySerializer,
    DutySessionSerializer,
    AdminDutyMonitoringSerializer,
)
User = get_user_model()
from apps.delivery.services import (
    assign_delivery,
    update_delivery_status,
    reassign_failed_delivery,
)


class DeliveryAssignmentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = DeliveryAssignmentSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        queryset = Delivery.objects.select_related(
            "order",
            "delivery_staff",
            "assigned_by",
        ).all()

        status_value = self.request.query_params.get("status")
        staff_id = self.request.query_params.get("delivery_staff")
        search = self.request.query_params.get("search")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if status_value:
            queryset = queryset.filter(status=status_value)

        if staff_id:
            queryset = queryset.filter(delivery_staff_id=staff_id)

        if search:
            queryset = queryset.filter(
                Q(order__order_number__icontains=search)
                | Q(delivery_staff__email__icontains=search)
                | Q(order__recipient_name__icontains=search)
                | Q(order__recipient_phone__icontains=search)
            )

        if date_from:
            queryset = queryset.filter(assigned_at__date__gte=date_from)

        if date_to:
            queryset = queryset.filter(assigned_at__date__lte=date_to)

        ordering = self.request.query_params.get("ordering", "-assigned_at")
        allowed_ordering = {
            "assigned_at",
            "-assigned_at",
            "updated_at",
            "-updated_at",
            "status",
            "-status",
        }

        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    def perform_create(self, serializer):
        try:
            delivery = assign_delivery(
                order_id=serializer.validated_data["order"].id,
                delivery_staff=serializer.validated_data["delivery_staff"],
                assigned_by=self.request.user,
                notes=serializer.validated_data.get("notes", ""),
            )
            serializer.instance = delivery

        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)
        except IntegrityError:
            raise ValidationError("This order already has a delivery assignment.")


class DeliveryAssignmentDetailAPIView(generics.RetrieveAPIView):
    serializer_class = DeliveryAssignmentDetailSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        return Delivery.objects.select_related(
            "order",
            "delivery_staff",
            "assigned_by",
        ).prefetch_related("order__items")


class DeliveryAssignmentHistoryAPIView(generics.ListAPIView):
    serializer_class = DeliveryAssignmentHistorySerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        get_object_or_404(
            Delivery,
            pk=self.kwargs['pk']
        )

        return DeliveryAssignmentHistory.objects.filter(
            delivery_id=self.kwargs['pk']
        ).select_related(
            'delivery_staff',
            'assigned_by',
        )


class MyDeliveryListAPIView(generics.ListAPIView):
    serializer_class = MyDeliverySerializer
    permission_classes = [IsDeliveryStaff]

    def get_queryset(self):
        return (
            Delivery.objects.filter(delivery_staff=self.request.user)
            .select_related("order", "delivery_staff", "assigned_by")
            .prefetch_related("order__items")
        )


class DeliveryStatusUpdateAPIView(generics.UpdateAPIView):
    serializer_class = DeliveryStatusUpdateSerializer
    permission_classes = [IsDeliveryStaff]
    http_method_names = ["patch", "options"]

    def get_queryset(self):
        return Delivery.objects.filter(delivery_staff=self.request.user)

    def patch(self, request, *args, **kwargs):
        delivery = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_delivery = update_delivery_status(
                delivery_id=delivery.id,
                delivery_staff=request.user,
                new_status=serializer.validated_data["status"],
                failed_reason=serializer.validated_data.get("failed_reason", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        response_serializer = MyDeliverySerializer(updated_delivery)
        return Response(response_serializer.data)


class DeliveryReassignAPIView(generics.GenericAPIView):
    serializer_class = DeliveryReassignSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        return Delivery.objects.select_related("order", "delivery_staff", "assigned_by")

    def patch(self, request, *args, **kwargs):
        delivery = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_delivery = reassign_failed_delivery(
                delivery_id=delivery.id,
                new_delivery_staff=serializer.validated_data["delivery_staff"],
                assigned_by=request.user,
                notes=serializer.validated_data.get("notes", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        response_serializer = DeliveryAssignmentSerializer(updated_delivery)
        return Response(response_serializer.data)


class DutyStartAPIView(generics.GenericAPIView):
    permission_classes = [IsDeliveryStaff]
    serializer_class = DutySessionSerializer

    def post(self, request):
        # Prevent duplicate active duty sessions
        active_session = DutySession.objects.filter(
            delivery_staff=request.user, ended_at__isnull=True
        ).first()

        if active_session:
            return Response(
                {
                    "message": "Your duty is already active.",
                    "duty": self.get_serializer(active_session).data,
                },
                status=status.HTTP_200_OK,
            )

        # Create a new duty session safely
        try:
            with transaction.atomic():
                session = DutySession.objects.create(delivery_staff=request.user)
        except IntegrityError:
            session = DutySession.objects.get(
                delivery_staff=request.user, ended_at__isnull=True
            )

            return Response(
                {
                    "message": "Your duty is already active.",
                    "duty": self.get_serializer(session).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "message": "Duty started successfully.",
                "duty": self.get_serializer(session).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DutyEndAPIView(generics.GenericAPIView):
    permission_classes = [IsDeliveryStaff]
    serializer_class = DutySessionSerializer

    def post(self, request):
        has_active_delivery = Delivery.objects.filter(
            delivery_staff=request.user,
            status__in=[
                Delivery.Status.ASSIGNED,
                Delivery.Status.PICKED_UP,
                Delivery.Status.IN_TRANSIT,
            ],
        ).exists()

        if has_active_delivery:
            return Response(
                {
                    "message": (
                        "Complete your active delivery "
                        "before ending duty."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        session = DutySession.objects.filter(
            delivery_staff=request.user, ended_at__isnull=True
        ).first()

        if not session:
            return Response(
                {"message": "You do not have an active duty session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.ended_at = timezone.now()
        session.save(update_fields=["ended_at"])

        return Response(
            {
                "message": "Duty ended successfully.",
                "duty": self.get_serializer(session).data,
            },
            status=status.HTTP_200_OK,
        )


class DutyStatusAPIView(generics.GenericAPIView):
    permission_classes = [IsDeliveryStaff]
    serializer_class = DutySessionSerializer

    def get(self, request):
        session = DutySession.objects.filter(
            delivery_staff=request.user, ended_at__isnull=True
        ).first()

        if not session:
            availability = "OFFLINE"
        else:
            has_active_delivery = Delivery.objects.filter(
                delivery_staff=request.user,
                status__in=[
                    Delivery.Status.ASSIGNED,
                    Delivery.Status.PICKED_UP,
                    Delivery.Status.IN_TRANSIT,
                ],
            ).exists()

            availability = "ON_DELIVERY" if has_active_delivery else "AVAILABLE"

        return Response(
            {
                "availability": availability,
                "duty": (self.get_serializer(session).data if session else None),
            }
        )


class AdminDutyMonitoringAPIView(generics.ListAPIView):
    serializer_class = AdminDutyMonitoringSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        active_statuses = [
            Delivery.Status.ASSIGNED,
            Delivery.Status.PICKED_UP,
            Delivery.Status.IN_TRANSIT,
        ]

        active_duty_queryset = DutySession.objects.filter(
            ended_at__isnull=True
        ).order_by("-started_at")

        queryset = (
            User.objects.filter(role=User.Role.DELIVERY)
            .prefetch_related(
                "delivery_areas",
                Prefetch(
                    "duty_sessions",
                    queryset=active_duty_queryset,
                    to_attr="active_duty_sessions",
                ),
            )
            .annotate(
                active_delivery_count=Count(
                    "assigned_deliveries",
                    filter=Q(assigned_deliveries__status__in=active_statuses),
                    distinct=True,
                )
            )
            .order_by("first_name", "last_name", "email")
        )

        for staff in queryset:
            staff.active_duty = (
                staff.active_duty_sessions[0] if staff.active_duty_sessions else None
            )

        return queryset
