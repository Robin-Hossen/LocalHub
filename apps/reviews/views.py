
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Review
from .serializers import (
    ReviewSerializer,
    CreateReviewSerializer,
    UpdateReviewSerializer,
    PublicReviewSerializer,
    ModerateReviewSerializer,
)
from .permissions import IsCustomer, IsAdminOrOperations
from .services import create_review, update_review, delete_review


class PublicReviewListAPIView(generics.ListAPIView):
    serializer_class = PublicReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Review.objects.filter(
            status=Review.Status.APPROVED,
            product__is_active=True,
        ).select_related('product')

        product_id = self.request.query_params.get('product_id')

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset


class CustomerReviewListCreateAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = CreateReviewSerializer

    def get(self, request):
        reviews = Review.objects.filter(
            customer=request.user
        ).select_related('product', 'order')

        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            review = create_review(
                customer=request.user,
                **serializer.validated_data
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED
        )


class CustomerReviewDetailAPIView(APIView):
    permission_classes = [IsCustomer]
    serializer_class = UpdateReviewSerializer

    
    def patch(self, request, pk):
        serializer = UpdateReviewSerializer(
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        try:
            review = update_review(
                customer=request.user,
                review_id=pk,
                **serializer.validated_data
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(ReviewSerializer(review).data)


    def delete(self, request, pk):
        try:
            delete_review(
                customer=request.user,
                review_id=pk
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffReviewListAPIView(generics.ListAPIView):
    queryset = Review.objects.select_related(
        'customer', 'order', 'product'
    ).all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminOrOperations]


class StaffReviewModerationAPIView(generics.UpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ModerateReviewSerializer
    permission_classes = [IsAdminOrOperations]
