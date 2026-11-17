from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import APIView

from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from apps.procurement.filters import PurchaseReceiptFilter

from apps.procurement.models import PurchaseOrder,PurchaseReceipt

from apps.procurement.serializers import (
    PurchaseOrderCreateSerializer,
    PurchaseOrderResponseSerializer,
    PurchaseReceiptCreateSerializer,
    PurchaseReceiptResponseSerializer,
    
)
from apps.procurement.services import (
    create_purchase_order,
    update_purchase_order,
    confirm_purchase_order,
    receive_purchase_order,
)
from apps.orders.permissions import IsAdminOrOperations


class PurchaseOrderCreateAPIView(generics.GenericAPIView):

    serializer_class = PurchaseOrderCreateSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations
    ]

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            purchase_order = create_purchase_order(
                vendor_id=serializer.validated_data['vendor_id'],
                items_data=serializer.validated_data['items'],
                created_by=request.user,
                notes=serializer.validated_data.get('notes', '')
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        return Response(
            PurchaseOrderResponseSerializer(purchase_order).data,
            status=status.HTTP_201_CREATED
        )


class PurchaseOrderListAPIView(generics.ListAPIView):

    serializer_class = PurchaseOrderResponseSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations
    ]

    queryset = PurchaseOrder.objects.select_related(
        'vendor',
        'created_by'
    ).prefetch_related('items').order_by('-created_at')



class PurchaseOrderDetailAPIView(generics.RetrieveAPIView):

    serializer_class = PurchaseOrderResponseSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations
    ]

    queryset = PurchaseOrder.objects.select_related(
        'vendor',
        'created_by'
    ).prefetch_related('items')

    def patch(self, request, *args, **kwargs):

        serializer = PurchaseOrderCreateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            purchase_order = update_purchase_order(
                purchase_order_id=kwargs['pk'],
                vendor_id=serializer.validated_data['vendor_id'],
                items_data=serializer.validated_data['items'],
                notes=serializer.validated_data.get('notes', '')
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        return Response(
            PurchaseOrderResponseSerializer(purchase_order).data,
            status=status.HTTP_200_OK
        )




class PurchaseOrderConfirmAPIView(APIView):

    serializer_class = PurchaseOrderResponseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request, pk):

        try:
            purchase_order = confirm_purchase_order(pk)

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        return Response(
            PurchaseOrderResponseSerializer(purchase_order).data,
            status=status.HTTP_200_OK
        )


class PurchaseOrderReceiveAPIView(APIView):

    serializer_class = PurchaseReceiptCreateSerializer

    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request, pk):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            receipt = receive_purchase_order(
                purchase_order_id=pk,
                items_data=serializer.validated_data['items'],
                received_by=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        return Response(
            PurchaseReceiptResponseSerializer(receipt).data,
            status=status.HTTP_201_CREATED
        )

class PurchaseReceiptListAPIView(generics.ListAPIView):

    serializer_class = PurchaseReceiptResponseSerializer

    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    queryset = PurchaseReceipt.objects.select_related(
        'purchase_order',
        'received_by'
    ).prefetch_related(
        'items',
        'items__purchase_order_item'
    ).order_by('-received_at')

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = PurchaseReceiptFilter

    search_fields = [
        'purchase_order__purchase_number',
        'received_by__email',
        'notes',
        'items__purchase_order_item__product_name',
        'items__purchase_order_item__product_sku',
    ]

    ordering_fields = [
        'received_at',
        'id',
    ]

    ordering = ['-received_at']    