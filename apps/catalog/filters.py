import django_filters

from apps.catalog.models import Product


class ProductFilter(django_filters.FilterSet):

    category = django_filters.NumberFilter(
        field_name='category_id'
    )

    min_price = django_filters.NumberFilter(
        field_name='selling_price',
        lookup_expr='gte'
    )

    max_price = django_filters.NumberFilter(
        field_name='selling_price',
        lookup_expr='lte'
    )

    class Meta:
        model = Product
        fields = [
            'category',
            'min_price',
            'max_price',
        ]
        
class StaffProductFilter(ProductFilter):

    vendor = django_filters.NumberFilter(
        field_name='vendor_id'
    )

    is_active = django_filters.BooleanFilter()

    is_available = django_filters.BooleanFilter()

    class Meta(ProductFilter.Meta):
        fields = [
            'category',
            'min_price',
            'max_price',
            'vendor',
            'is_active',
            'is_available',
        ]        