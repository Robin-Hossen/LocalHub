from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.vendors.models import Vendor
from apps.vendors.serializers.vendor import VendorSerializer
from apps.vendors.permissions import (
    IsAdminOrOperations,
    IsAdminRole,
)

from apps.vendors.models import VendorType
from apps.vendors.serializers.vendor_type import VendorTypeSerializer


class VendorListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = VendorSerializer

    def get_queryset(self):
        return Vendor.objects.select_related(
            'vendor_type',
            'area',
        ).order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated(), IsAdminOrOperations()]


class VendorDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VendorSerializer

    def get_queryset(self):
        return Vendor.objects.select_related(
            'vendor_type',
            'area',
        )

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated(), IsAdminOrOperations()]


class VendorTypeListAPIView(generics.ListAPIView):
    serializer_class = VendorTypeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    queryset = VendorType.objects.filter(
        is_active=True
    ).order_by('name')