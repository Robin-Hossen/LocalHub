from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Stock, StockMovement


@transaction.atomic
def add_stock(product, quantity, movement_type, created_by=None, reference='', notes=''):
    allowed_types = [
        StockMovement.MovementType.PURCHASE,
        StockMovement.MovementType.CUSTOMER_RETURN,
        StockMovement.MovementType.ADJUSTMENT_IN,
    ]

    if movement_type not in allowed_types:
       raise ValidationError("Invalid movement type for adding stock.")
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    stock, created = Stock.objects.select_for_update().get_or_create(
        product=product
    )

    stock.available_quantity += quantity
    stock.save(update_fields=['available_quantity', 'updated_at'])

    StockMovement.objects.create(
        product=product,
        movement_type=movement_type,
        quantity=quantity,
        created_by=created_by,
        reference=reference,
        notes=notes
    )

    return stock


@transaction.atomic
def remove_stock(product, quantity, movement_type, created_by=None, reference='', notes=''):
    
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    allowed_types = [
        StockMovement.MovementType.DAMAGE,
        StockMovement.MovementType.ADJUSTMENT_OUT,
    ]

    if movement_type not in allowed_types:
        raise ValidationError("Invalid stock reduction movement type.")

    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError("Stock record does not exist.")

    sellable_quantity = (
        stock.available_quantity - stock.reserved_quantity
    )

    if quantity > sellable_quantity:
        raise ValidationError(
            f"Insufficient sellable stock. Available: {sellable_quantity}"
        )

    stock.available_quantity -= quantity
    stock.save(update_fields=['available_quantity', 'updated_at'])

    StockMovement.objects.create(
        product=product,
        movement_type=movement_type,
        quantity=quantity,
        created_by=created_by,
        reference=reference,
        notes=notes
    )

    return stock

@transaction.atomic
def reserve_stock(product, quantity, created_by=None, reference='', notes=''):

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError("Stock record does not exist.")

    sellable_quantity = (
        stock.available_quantity - stock.reserved_quantity
    )

    if quantity > sellable_quantity:
        raise ValidationError(
            f"Insufficient stock. Available: {sellable_quantity}"
        )

    stock.reserved_quantity += quantity
    stock.save(update_fields=['reserved_quantity', 'updated_at'])

    StockMovement.objects.create(
        product=product,
        movement_type=StockMovement.MovementType.RESERVE,
        quantity=quantity,
        created_by=created_by,
        reference=reference,
        notes=notes
    )

    return stock

@transaction.atomic
def release_stock(product, quantity, created_by=None, reference='', notes=''):

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError("Stock record does not exist.")

    if quantity > stock.reserved_quantity:
        raise ValidationError(
            "Cannot release more stock than reserved quantity."
        )

    stock.reserved_quantity -= quantity
    stock.save(update_fields=['reserved_quantity', 'updated_at'])

    StockMovement.objects.create(
        product=product,
        movement_type=StockMovement.MovementType.RELEASE,
        quantity=quantity,
        created_by=created_by,
        reference=reference,
        notes=notes
    )

    return stock

@transaction.atomic
def consume_reserved_stock(
    product,
    quantity,
    created_by=None,
    reference='',
    notes=''
):
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    try:
        stock = Stock.objects.select_for_update().get(product=product)
    except Stock.DoesNotExist:
        raise ValidationError("Stock record does not exist.")

    if quantity > stock.reserved_quantity:
        raise ValidationError(
            "Insufficient reserved stock."
        )

    stock.available_quantity -= quantity
    stock.reserved_quantity -= quantity

    stock.save(
        update_fields=[
            'available_quantity',
            'reserved_quantity',
            'updated_at'
        ]
    )

    StockMovement.objects.create(
        product=product,
        movement_type=StockMovement.MovementType.SALE,
        quantity=quantity,
        created_by=created_by,
        reference=reference,
        notes=notes
    )

    return stock