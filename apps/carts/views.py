from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db import transaction
from apps.orders.services import create_order
from apps.orders.serializers import CustomerOrderSerializer
from .serializers import CheckoutSerializer
from apps.locations.models import CustomerAddress

from .models import Cart
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)
from .services import (
    add_to_cart,
    update_cart_item,
    remove_cart_item,
    clear_cart,
)


class IsCustomer(IsAuthenticated):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == 'CUSTOMER'
        )


class CartAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = CartSerializer

    def get(self, request):
        cart, created = Cart.objects.get_or_create(
            customer=request.user
        )

        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = AddToCartSerializer

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = add_to_cart(
                customer=request.user,
                product_id=serializer.validated_data['product'].id,
                quantity=serializer.validated_data['quantity'],
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK
        )


class CartItemDetailAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = UpdateCartItemSerializer

    def patch(self, request, pk):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart_item = update_cart_item(
                customer=request.user,
                item_id=pk,
                quantity=serializer.validated_data['quantity'],
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(CartItemSerializer(cart_item).data)

    def delete(self, request, pk):
        try:
            remove_cart_item(
                customer=request.user,
                item_id=pk
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(status=status.HTTP_204_NO_CONTENT)


class ClearCartAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = CartSerializer

    def delete(self, request):
        clear_cart(request.user)

        return Response(
            {'message': 'Cart cleared successfully.'},
            status=status.HTTP_200_OK
        )



class CheckoutAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = CheckoutSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        notes = data['notes']

        try:
            with transaction.atomic():
                cart, created = Cart.objects.get_or_create(
                    customer=request.user
                )

                cart = Cart.objects.select_for_update().get(
                    pk=cart.pk
                )

                cart_items = list(
                    cart.items.select_related('product').order_by('id')
                )

                if not cart_items:
                    raise serializers.ValidationError(
                        'Your cart is empty.'
                    )

                # Use existing saved address or create a new one.
                address_id = data.get('address_id')

                if not address_id:
                    save_address = data['save_address']

                    is_first_saved_address = not CustomerAddress.objects.filter(
                        customer=request.user,
                        is_saved=True
                    ).exists()

                    address = CustomerAddress.objects.create(
                        customer=request.user,
                        address_type=data['address_type'],
                        recipient_name=data['recipient_name'],
                        phone=data['phone'],
                        area=data['area'],
                        address_line=data['address_line'],
                        landmark=data['landmark'],
                        is_saved=save_address,
                        is_default=(
                            save_address and is_first_saved_address
                        ),
                    )

                    address_id = address.id

                items_data = [
                    {
                        'product_id': item.product_id,
                        'quantity': item.quantity,
                    }
                    for item in cart_items
                ]

                order = create_order(
                    customer=request.user,
                    address_id=address_id,
                    items_data=items_data,
                    notes=notes,
                )

                cart.items.all().delete()

            return Response(
                CustomerOrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )

        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)