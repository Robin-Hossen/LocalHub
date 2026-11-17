import django_filters

from apps.cod.models import CODCollection


class CODCollectionFilter(django_filters.FilterSet):

    collected_from = django_filters.DateFilter(
        field_name='collected_at',
        lookup_expr='date__gte'
    )

    collected_to = django_filters.DateFilter(
        field_name='collected_at',
        lookup_expr='date__lte'
    )

    amount_min = django_filters.NumberFilter(
        field_name='amount_collected',
        lookup_expr='gte'
    )

    amount_max = django_filters.NumberFilter(
        field_name='amount_collected',
        lookup_expr='lte'
    )

    class Meta:
        model = CODCollection
        fields = [
            'order',
            'collected_by',
        ]