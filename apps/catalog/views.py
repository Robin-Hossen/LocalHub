from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import extend_schema, OpenApiRequest
from drf_spectacular.types import OpenApiTypes

from apps.catalog.models import Category, Product
from apps.catalog.permissions import IsAdminOrOperations
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.catalog.pagination import ProductPagination
from django_filters.rest_framework import DjangoFilterBackend
from apps.catalog.filters import ProductFilter, StaffProductFilter

from apps.catalog.serializers.category import CategorySerializer
from apps.catalog.serializers.customer import CustomerProductSerializer
from apps.catalog.serializers.product import ProductSerializer


import zipfile
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from apps.catalog.serializers.bulk_image import BulkProductImageUploadSerializer
from apps.catalog.services.bulk_image_upload import bulk_upload_product_images

from django.db import transaction

from apps.audit_logs.models import AuditLog
from apps.audit_logs.services import create_audit_log


def get_product_audit_values(product):
    return {
        'sku': product.sku,
        'name': product.name,
        'category_id': product.category_id,
        'vendor_id': product.vendor_id,
        'selling_price': str(product.selling_price),
        'cost_price': str(product.cost_price),
        'is_available': product.is_available,
        'is_active': product.is_active,
    }


# Customer APIs

class CategoryListAPIView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Category.objects.filter(
            is_active=True
        ).select_related('parent').order_by('name')


class CustomerProductListAPIView(generics.ListAPIView):
    serializer_class = CustomerProductSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = ProductFilter

    search_fields = [
        'name',
        'sku',
        'description',
        'category__name',
    ]

    ordering_fields = [
        'name',
        'selling_price',
        'created_at',
    ]

    ordering = ['name']

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_available=True,
            category__is_active=True,
            vendor__is_active=True,
        ).select_related(
            'category',
            'stock',
        ).order_by('name')

class CustomerProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = CustomerProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_available=True,
            category__is_active=True,
            vendor__is_active=True,
        ).select_related('category')


# Staff APIs

class StaffProductListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    
    permission_classes = [IsAdminOrOperations]
    pagination_class = ProductPagination

    filter_backends = [SearchFilter, OrderingFilter]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = StaffProductFilter

    search_fields = [
        'name',
        'sku',
        'description',
        'category__name',
        'vendor__name',
    ]

    ordering_fields = [
        'name',
        'selling_price',
        'cost_price',
        'created_at',
    ]

    ordering = ['name']

    queryset = Product.objects.select_related(
        'category',
        'vendor',
    ).order_by('name')

    @transaction.atomic
    def perform_create(self, serializer):
        product = serializer.save()

        create_audit_log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            model_name=product._meta.label,
            object_id=product.pk,
            description=f"Created product: {product.name}",
            new_values=get_product_audit_values(product),
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

@extend_schema(
    request={
        'multipart/form-data': OpenApiRequest(
            request=ProductSerializer,
            encoding={
                'image': {
                    'contentType': 'image/jpeg,image/png,image/webp'
                }
            }
        )
    }
)
class StaffProductDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrOperations]

    queryset = Product.objects.select_related(
        'category',
        'vendor',
    )
    parser_classes = [
    MultiPartParser,
    FormParser,
    JSONParser,
    ]

    @transaction.atomic
    def perform_update(self, serializer):
        product = serializer.instance

        old_values = get_product_audit_values(product)

        product = serializer.save()

        new_values = get_product_audit_values(product)

        create_audit_log(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            model_name=product._meta.label,
            object_id=product.pk,
            description=f"Updated product: {product.name}",
            old_values=old_values,
            new_values=new_values,
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

    def get_serializer(self, *args, **kwargs):
        if self.request.method == 'PATCH':
            kwargs['partial'] = True

        return super().get_serializer(*args, **kwargs)


# Staff Category APIs


class StaffCategoryListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrOperations]
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    queryset = Category.objects.select_related("parent").order_by("name")


class StaffCategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrOperations]
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    queryset = Category.objects.select_related("parent")


class BulkProductImageUploadAPIView(generics.GenericAPIView):
    serializer_class = BulkProductImageUploadSerializer
    permission_classes = [IsAdminOrOperations]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        zip_file = serializer.validated_data["file"]

        try:
            results = bulk_upload_product_images(zip_file)

        except zipfile.BadZipFile:
            return Response(
                {"error": "Invalid or corrupted ZIP file."},
                status=400,
            )

        except ValueError as exc:
            return Response(
                {"error": str(exc)},
                status=400,
            )

        return Response(
            {
                "message": "Bulk image upload completed.",
                **results,
            },
            status=200,
        )
