from rest_framework import generics, permissions
from .serializers import (
    CustomerRegistrationSerializer,
    CustomerProfileSerializer,
    DeliveryStaffListSerializer,
    DeliveryStaffManagementSerializer,
)


from django.contrib.auth import get_user_model
from apps.delivery.permissions import IsAdminOrOperations

User = get_user_model()


class CustomerRegistrationView(generics.CreateAPIView):
    serializer_class = CustomerRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class DeliveryStaffListAPIView(generics.ListAPIView):
    serializer_class = DeliveryStaffListSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.DELIVERY, is_active=True).order_by(
            "first_name", "last_name", "email"
        )


class DeliveryStaffManagementListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = DeliveryStaffManagementSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        return (
            User.objects.filter(role=User.Role.DELIVERY)
            .prefetch_related("delivery_areas")
            .order_by("-date_joined")
        )


class DeliveryStaffManagementDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = DeliveryStaffManagementSerializer
    permission_classes = [IsAdminOrOperations]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.DELIVERY).prefetch_related(
            "delivery_areas"
        )
