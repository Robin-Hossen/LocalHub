
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):

    customer_email = serializers.EmailField(
        source='customer.email',
        read_only=True
    )

    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    order_number = serializers.CharField(
        source='order.order_number',
        read_only=True
    )

    class Meta:
        model = Review
        fields = (
            'id',
            'customer',
            'customer_email',
            'order',
            'order_number',
            'product',
            'product_name',
            'rating',
            'comment',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'customer',
            'status',
            'created_at',
            'updated_at',
        )


class CreateReviewSerializer(serializers.Serializer):

    order_id = serializers.IntegerField(min_value=1)
    product_id = serializers.IntegerField(min_value=1)

    rating = serializers.IntegerField(
        min_value=1,
        max_value=5
    )

    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )


class UpdateReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review
        fields = ('rating', 'comment')




class PublicReviewSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    class Meta:
        model = Review
        fields = (
            'id',
            'product',
            'product_name',
            'rating',
            'comment',
            'created_at',
        )


class ModerateReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review
        fields = ('status',)

    def validate_status(self, value):
        if value not in [
            Review.Status.APPROVED,
            Review.Status.REJECTED,
        ]:
            raise serializers.ValidationError(
                'Invalid moderation status.'
            )
        return value
