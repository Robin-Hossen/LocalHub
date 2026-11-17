import django_filters

from apps.procurement.models import PurchaseReceipt


class PurchaseReceiptFilter(django_filters.FilterSet):

    purchase_order = django_filters.NumberFilter(
        field_name='purchase_order_id'
    )

    received_by = django_filters.NumberFilter(
        field_name='received_by_id'
    )

    received_from = django_filters.DateFilter(
        field_name='received_at',
        lookup_expr='date__gte'
    )

    received_to = django_filters.DateFilter(
        field_name='received_at',
        lookup_expr='date__lte'
    )

    class Meta:
        model = PurchaseReceipt
        fields = [
            'purchase_order',
            'received_by',
        ]