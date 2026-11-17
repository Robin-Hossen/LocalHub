from django.shortcuts import render

# Create your views here.
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.vendors.models import Vendor
from apps.vendor_accounts.models import VendorPayment, VendorLedger

from apps.vendor_accounts.serializers import (
    VendorPaymentSerializer,
    VendorLedgerSerializer,
    VendorBalanceSerializer,
    VendorAdjustmentSerializer,
)

from apps.vendor_accounts.permissions import IsAdminOrOperations

from apps.vendor_accounts.services import (
    get_vendor_balance,
    record_vendor_payment,
    create_vendor_adjustment,
)



class VendorBalanceAPIView(generics.GenericAPIView):
    serializer_class = VendorBalanceSerializer
    permission_classes = [IsAdminOrOperations]

    def get(self, request, vendor_id):
        get_object_or_404(Vendor, id=vendor_id)

        balance = get_vendor_balance(vendor_id)

        serializer = self.get_serializer(balance)

        return Response(serializer.data)


class VendorLedgerListAPIView(generics.ListAPIView):
    serializer_class = VendorLedgerSerializer
    permission_classes = [IsAdminOrOperations]

    queryset = VendorLedger.objects.select_related(
        'vendor',
        'purchase_order',
        'payment',
        'created_by',
    )


    filterset_fields = [
        'vendor',
        'transaction_type',
        'created_by',
    ]

    search_fields = [
        'vendor__name',
        'reference',
        'notes',
        'purchase_order__purchase_number',
        'created_by__email',
    ]

    ordering_fields = [
        'created_at',
        'amount',
        'transaction_type',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        vendor_id = self.request.query_params.get('vendor')

        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)

        return queryset


class VendorPaymentListCreateAPIView(generics.ListAPIView):
    serializer_class = VendorPaymentSerializer
    permission_classes = [IsAdminOrOperations]

    queryset = VendorPayment.objects.select_related(
        'vendor',
        'paid_by',
    )

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'vendor',
        'payment_method',
        'paid_by',
    ]

    search_fields = [
        'vendor__name',
        'reference',
        'notes',
        'paid_by__email',
    ]

    ordering_fields = [
        'paid_at',
        'amount',
        'payment_method',
    ]

    ordering = ['-paid_at']

    def post(self, request):
        serializer = VendorPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = record_vendor_payment(
                vendor_id=serializer.validated_data['vendor'].id,
                amount=serializer.validated_data['amount'],
                payment_method=serializer.validated_data['payment_method'],
                paid_by=request.user,
                reference=serializer.validated_data.get('reference', ''),
                notes=serializer.validated_data.get('notes', ''),
            )

        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        response_serializer = VendorPaymentSerializer(payment)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )



class VendorAdjustmentAPIView(generics.GenericAPIView):
    serializer_class = VendorAdjustmentSerializer
    permission_classes = [IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            ledger_entry = create_vendor_adjustment(
                vendor_id=data['vendor'].id,
                amount=data['amount'],
                adjustment_type=data['adjustment_type'],
                created_by=request.user,
                reference=data.get('reference', ''),
                notes=data.get('notes', ''),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        response_serializer = VendorLedgerSerializer(ledger_entry)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    