from rest_framework import serializers

from apps.catalog.models import Product


class CustomerProductSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source='category.name',
        read_only=True,
    )
    is_in_stock = serializers.SerializerMethodField()

    def get_is_in_stock(self, obj)->bool:
        stock = getattr(obj, 'stock', None)

        if stock is None:
            return False

        return stock.available_quantity > stock.reserved_quantity

    class Meta:
        model = Product

        fields = [
            'id',
            'sku',
            'name',
            'category',
            'category_name',
            'description',
            'selling_price',
            'image',
            'is_available',
            'is_in_stock',
        ]

        read_only_fields = fields