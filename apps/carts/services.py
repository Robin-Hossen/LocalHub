from django.db import transaction
from django.core.exceptions import ValidationError

from apps.catalog.models import Product
from apps.inventory.models import Stock

from .models import Cart, CartItem


@transaction.atomic
def add_to_cart(customer, product_id, quantity):
    # Lock and retrieve product
    try:
        product = Product.objects.select_for_update().select_related(
            'vendor', 'category'
        ).get(id=product_id)
    except Product.DoesNotExist:
        raise ValidationError('Product does not exist.')

    # Validate product availability
    if not product.is_active or not product.is_available:
        raise ValidationError('This product is not available.')

    if not product.category.is_active:
        raise ValidationError('Product category is inactive.')

    if not product.vendor.is_active:
        raise ValidationError('Product vendor is inactive.')

    # Get or create customer cart
    cart, created = Cart.objects.get_or_create(customer=customer)

    # Prevent multiple vendors in one cart
    other_vendor_items = cart.items.exclude(
        product=product
    ).exclude(
        product__vendor=product.vendor
    )

    if other_vendor_items.exists():
        raise ValidationError(
            'You can only add products from one vendor to a cart.'
        )

    # Check available stock
    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError('Stock information is unavailable.')

    sellable_quantity = (
        stock.available_quantity - stock.reserved_quantity
    )

    cart_item = CartItem.objects.filter(
        cart=cart,
        product=product
    ).first()

    current_quantity = cart_item.quantity if cart_item else 0
    new_quantity = current_quantity + quantity

    if new_quantity > sellable_quantity:
        raise ValidationError(
            f'Only {sellable_quantity} units are available.'
        )

    if cart_item:
        cart_item.quantity = new_quantity
        cart_item.save(update_fields=['quantity', 'updated_at'])
    else:
        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity
        )

    return cart


@transaction.atomic
def update_cart_item(customer, item_id, quantity):
    try:
        cart_item = CartItem.objects.select_for_update().select_related(
            'cart', 'product'
        ).get(
            id=item_id,
            cart__customer=customer
        )
    except CartItem.DoesNotExist:
        raise ValidationError('Cart item not found.')

    product = Product.objects.select_related(
        'vendor', 'category'
    ).get(id=cart_item.product_id)

    if (
        not product.is_active
        or not product.is_available
        or not product.category.is_active
        or not product.vendor.is_active
    ):
        raise ValidationError('This product is not available.')

    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError('Stock information is unavailable.')

    sellable_quantity = (
        stock.available_quantity - stock.reserved_quantity
    )

    if quantity > sellable_quantity:
        raise ValidationError(
            f'Only {sellable_quantity} units are available.'
        )

    cart_item.quantity = quantity
    cart_item.save(update_fields=['quantity', 'updated_at'])

    return cart_item


@transaction.atomic
def remove_cart_item(customer, item_id):
    try:
        cart_item = CartItem.objects.select_for_update().get(
            id=item_id,
            cart__customer=customer
        )
    except CartItem.DoesNotExist:
        raise ValidationError('Cart item not found.')

    cart_item.delete()


@transaction.atomic
def clear_cart(customer):
    try:
        cart = Cart.objects.get(customer=customer)
    except Cart.DoesNotExist:
        return

    cart.items.all().delete()