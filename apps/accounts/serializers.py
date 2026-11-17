from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.locations.models import Area

User = get_user_model()


class CustomerRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role=User.Role.CUSTOMER,
            **validated_data
        )

        return user

class CustomerProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
        ]
        read_only_fields = ["id", "email", "role"]


class DeliveryStaffListSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
        ]


class DeliveryStaffManagementSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=False, min_length=8)

    delivery_areas = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Area.objects.filter(is_active=True), required=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
            "delivery_areas",
            "is_active",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        delivery_areas = validated_data.pop("delivery_areas", [])

        user = User.objects.create_user(
            password=password, role=User.Role.DELIVERY, **validated_data
        )

        user.delivery_areas.set(delivery_areas)

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        delivery_areas = validated_data.pop("delivery_areas", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if delivery_areas is not None:
            instance.delivery_areas.set(delivery_areas)

        return instance
