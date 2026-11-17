from rest_framework import serializers

from apps.vendor_accounts.models import VendorPayment, VendorLedger

from decimal import Decimal
from apps.vendors.models import Vendor
from apps.vendor_accounts.models import VendorLedger


class VendorPaymentSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(
        source='vendor.name',
        read_only=True
    )

    paid_by_email = serializers.EmailField(
        source='paid_by.email',
        read_only=True
    )

    class Meta:
        model = VendorPayment
        fields = [
            'id',
            'vendor',
            'vendor_name',
            'amount',
            'payment_method',
            'reference',
            'notes',
            'paid_by',
            'paid_by_email',
            'paid_at',
        ]

        read_only_fields = [
            'id',
            'paid_by',
            'paid_at',
        ]


class VendorLedgerSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(
        source='vendor.name',
        read_only=True
    )

    created_by_email = serializers.EmailField(
        source='created_by.email',
        read_only=True
    )

    purchase_number = serializers.CharField(
        source='purchase_order.purchase_number',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = VendorLedger
        fields = [
            'id',
            'vendor',
            'vendor_name',
            'transaction_type',
            'amount',
            'purchase_order',
            'purchase_number',
            'payment',
            'reference',
            'notes',
            'created_by',
            'created_by_email',
            'created_at',
        ]

        read_only_fields = fields



class VendorBalanceSerializer(serializers.Serializer):
    vendor_id = serializers.IntegerField()
    total_credit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    adjustment_credit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    adjustment_debit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_adjustment = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_payment = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    outstanding_balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )



class VendorAdjustmentSerializer(serializers.Serializer):
    vendor = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all()
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.01')
    )

    adjustment_type = serializers.ChoiceField(
        choices=[
            (
                VendorLedger.TransactionType.ADJUSTMENT_CREDIT,
                'Adjustment Credit'
            ),
            (
                VendorLedger.TransactionType.ADJUSTMENT_DEBIT,
                'Adjustment Debit'
            ),
        ]
    )

    reference = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )
