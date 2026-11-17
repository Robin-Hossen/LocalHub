from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.inventory.models import Stock, StockMovement
from apps.inventory.serializers.stock import (
    StockSerializer,
    StockMovementSerializer,
)
from apps.inventory.permissions import IsAdminOrOperations

from rest_framework.response import Response
from rest_framework import status
from apps.inventory.serializers.stock import StockOperationSerializer,StockRemoveSerializer,StockReserveSerializer,StockReleaseSerializer,StockConsumeSerializer
from apps.inventory.services import add_stock,remove_stock,reserve_stock,release_stock,consume_reserved_stock


from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend


class StockListAPIView(generics.ListAPIView):

    serializer_class = StockSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations,
    ]

    queryset = Stock.objects.select_related(
        'product'
    ).order_by('product__name')


class StockDetailAPIView(generics.RetrieveUpdateAPIView):
    
    serializer_class = StockSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations,
    ]

    queryset = Stock.objects.select_related('product')


class StockMovementListAPIView(generics.ListAPIView):

    serializer_class = StockMovementSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations,
    ]

    queryset = StockMovement.objects.select_related(
        'product',
        'created_by'
    ).order_by('-created_at')

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'product',
        'movement_type',
    ]

    search_fields = [
        'reference',
        'notes',
        'product__name',
        'product__sku',
    ]

    ordering_fields = [
        'created_at',
        'quantity',
        'movement_type',
    ]

    ordering = ['-created_at']


class StockAddAPIView(generics.GenericAPIView):
    serializer_class = StockOperationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stock = add_stock(
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            movement_type='PURCHASE',
            created_by=request.user,
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_200_OK
        )

class StockRemoveAPIView(generics.GenericAPIView):
    serializer_class = StockRemoveSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stock = remove_stock(
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            movement_type=serializer.validated_data['movement_type'],
            created_by=request.user,
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_200_OK
        )    

class StockReserveAPIView(generics.GenericAPIView):
    serializer_class = StockReserveSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stock = reserve_stock(
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            created_by=request.user,
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_200_OK
        )


class StockReleaseAPIView(generics.GenericAPIView):
    serializer_class = StockReleaseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stock = release_stock(
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            created_by=request.user,
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_200_OK
        )

class StockConsumeAPIView(generics.GenericAPIView):
    serializer_class = StockConsumeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stock = consume_reserved_stock(
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            created_by=request.user,
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            StockSerializer(stock).data,
            status=status.HTTP_200_OK
        )    