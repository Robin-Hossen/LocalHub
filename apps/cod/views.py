from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.cod.models import CODCollection
from apps.cod.serializers import (
    CODCollectionCreateSerializer,
    CODCollectionResponseSerializer,
)
from apps.cod.services import collect_cod_payment
from apps.orders.permissions import IsAdminOrOperations
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.cod.filters import CODCollectionFilter

class CODCollectionCreateAPIView(generics.GenericAPIView):

    serializer_class = CODCollectionCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            collection = collect_cod_payment(
                order_id=serializer.validated_data['order_id'],
                collected_by=request.user,
                amount_collected=serializer.validated_data['amount_collected'],
                notes=serializer.validated_data.get('notes', '')
            )

        except DjangoValidationError as error:
            raise DRFValidationError(error.messages)

        return Response(
            CODCollectionResponseSerializer(collection).data,
            status=status.HTTP_201_CREATED
        )


class CODCollectionListAPIView(generics.ListAPIView):

    serializer_class = CODCollectionResponseSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations
    ]

    queryset = CODCollection.objects.select_related(
        'order',
        'collected_by'
    ).order_by('-collected_at')

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]

    filterset_class = CODCollectionFilter

    search_fields = [
        'order__order_number',
        'collected_by__email',
        'notes'
    ]

    ordering_fields = [
        'collected_at',
        'amount_collected'
    ]

    ordering = ['-collected_at']