from rest_framework import serializers

from apps.locations.models import Area

from apps.catalog.models import Product
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    product_sku = serializers.CharField(
        source='product.sku',
        read_only=True
    )
    selling_price = serializers.DecimalField(
        source='product.selling_price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'selling_price',
            'quantity',
            'subtotal',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'product_name',
            'product_sku',
            'selling_price',
            'subtotal',
            'created_at',
            'updated_at',
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Cart
        fields = [
            'id',
            'items',
            'total_items',
            'subtotal',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product'
    )
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)







class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(
        min_value=1,
        required=False
    )

    address_type = serializers.ChoiceField(
        choices=['HOME', 'OFFICE', 'OTHER'],
        required=False,
        default='HOME'
    )

    recipient_name = serializers.CharField(
        max_length=150,
        required=False
    )

    phone = serializers.CharField(
        max_length=20,
        required=False
    )

    area = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        required=False
    )

    address_line = serializers.CharField(
        required=False
    )

    landmark = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default=''
    )

    save_address = serializers.BooleanField(
        required=False,
        default=False
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )

    def validate(self, attrs):
        address_id = attrs.get('address_id')

        new_address_fields = [
            'recipient_name',
            'phone',
            'area',
            'address_line',
        ]

        if address_id:
            if any(field in attrs for field in new_address_fields):
                raise serializers.ValidationError(
                    'Provide either a saved address or a new address.'
                )
        else:
            missing_fields = [
                field for field in new_address_fields
                if not attrs.get(field)
            ]

            if missing_fields:
                raise serializers.ValidationError({
                    field: 'This field is required.'
                    for field in missing_fields
                })

        return attrs

