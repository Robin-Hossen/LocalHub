from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Area, DeliveryCharge
from .serializers import AreaSerializer, DeliveryChargeSerializer

from rest_framework.permissions import IsAuthenticated
from .models import CustomerAddress
from .serializers import CustomerAddressSerializer
from .permissions import IsCustomer


class AreaListAPIView(generics.ListAPIView):

    serializer_class = AreaSerializer
    permission_classes = [AllowAny]

    queryset = Area.objects.filter(
        is_active=True
    ).order_by('name')


class DeliveryChargeListAPIView(generics.ListAPIView):

    serializer_class = DeliveryChargeSerializer
    permission_classes = [AllowAny]

    queryset = DeliveryCharge.objects.filter(
        is_active=True,
        area__is_active=True
    ).select_related('area').order_by('area__name')



class CustomerAddressListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = CustomerAddressSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer,
    ]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CustomerAddress.objects.none()

        return CustomerAddress.objects.filter(
            customer=self.request.user,
            is_saved=True
        ).select_related('area')

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            CustomerAddress.objects.filter(
                customer=self.request.user
            ).update(is_default=False)

        serializer.save(customer=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get(
            'is_default',
            serializer.instance.is_default
        ):
            CustomerAddress.objects.filter(
                customer=self.request.user
            ).exclude(
                id=serializer.instance.id
            ).update(is_default=False)

        serializer.save()    


class CustomerAddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = CustomerAddressSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer,
    ]

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            customer=self.request.user
        ).select_related('area')