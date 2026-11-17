
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.orders.models import Order, OrderItem
from .models import Review


@transaction.atomic
def create_review(
    customer,
    order_id,
    product_id,
    rating,
    comment=''
):
    # Lock and verify customer's order
    try:
        order = Order.objects.select_for_update().get(
            id=order_id,
            customer=customer
        )
    except Order.DoesNotExist:
        raise ValidationError(
            'Order not found.'
        )

    # Only delivered orders can be reviewed
    if order.status != 'DELIVERED':
        raise ValidationError(
            'You can only review delivered orders.'
        )

    # Verify product belongs to this order
    purchased = OrderItem.objects.filter(
        order=order,
        product_id=product_id
    ).exists()

    if not purchased:
        raise ValidationError(
            'This product does not belong to the selected order.'
        )

    # Prevent duplicate reviews
    if Review.objects.filter(
        order=order,
        product_id=product_id
    ).exists():
        raise ValidationError(
            'You have already reviewed this product for this order.'
        )

    review = Review.objects.create(
        customer=customer,
        order=order,
        product_id=product_id,
        rating=rating,
        comment=comment,
    )

    return review



@transaction.atomic
def update_review(customer, review_id, **validated_data):
    try:
        review = Review.objects.select_for_update().get(
            id=review_id,
            customer=customer
        )
    except Review.DoesNotExist:
        raise ValidationError('Review not found.')

    if not validated_data:
        raise ValidationError('Provide rating or comment to update.')

    for field, value in validated_data.items():
        setattr(review, field, value)

    

    review.save(
        update_fields=[
            *validated_data.keys(),
            'status',
            'updated_at',
        ]
    )

    return review



@transaction.atomic
def delete_review(customer, review_id):
    try:
        review = Review.objects.select_for_update().get(
            id=review_id,
            customer=customer
        )
    except Review.DoesNotExist:
        raise ValidationError('Review not found.')

    review.delete()
