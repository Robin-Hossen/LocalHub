from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.delivery.models import Delivery, DeliveryAssignmentHistory
from rest_framework import serializers
from .models import DutySession
from apps.accounts.models import User

User = get_user_model()


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    delivery_staff_email = serializers.EmailField(
        source="delivery_staff.email", read_only=True
    )
    assigned_by_email = serializers.EmailField(
        source="assigned_by.email", read_only=True
    )

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order",
            "order_number",
            "delivery_staff",
            "delivery_staff_email",
            "assigned_by",
            "assigned_by_email",
            "status",
            "assigned_at",
            "picked_up_at",
            "delivered_at",
            "failed_reason",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assigned_by",
            "status",
            "assigned_at",
            "picked_up_at",
            "delivered_at",
            "failed_reason",
            "created_at",
            "updated_at",
        ]

    def validate_delivery_staff(self, value):
        if value.role != "DELIVERY":
            raise serializers.ValidationError("Only delivery staff can be assigned.")
        if not value.is_active:
            raise serializers.ValidationError(
                "Inactive delivery staff cannot be assigned."
            )
        return value


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Delivery.Status.choices)
    failed_reason = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if (
            attrs["status"] == Delivery.Status.FAILED
            and not attrs.get("failed_reason", "").strip()
        ):
            raise serializers.ValidationError(
                {"failed_reason": "Failed reason is required."}
            )
        return attrs


class DeliveryOrderItemSerializer(serializers.Serializer):
    product_name = serializers.CharField(read_only=True)
    product_sku = serializers.CharField(read_only=True)
    quantity = serializers.IntegerField(read_only=True)


class DeliveryReassignSerializer(serializers.Serializer):
    delivery_staff = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="DELIVERY", is_active=True)
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class MyDeliverySerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    recipient_name = serializers.CharField(
        source="order.recipient_name", read_only=True
    )
    recipient_phone = serializers.CharField(
        source="order.recipient_phone", read_only=True
    )
    delivery_area_name = serializers.CharField(
        source="order.delivery_area_name", read_only=True
    )
    delivery_address_line = serializers.CharField(
        source="order.delivery_address_line", read_only=True
    )
    delivery_landmark = serializers.CharField(
        source="order.delivery_landmark", read_only=True
    )
    items = DeliveryOrderItemSerializer(source="order.items", many=True, read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order",
            "order_number",
            "recipient_name",
            "recipient_phone",
            "delivery_area_name",
            "delivery_address_line",
            "delivery_landmark",
            "items",
            "status",
            "assigned_at",
            "picked_up_at",
            "delivered_at",
            "failed_reason",
            "notes",
        ]
        read_only_fields = fields


class DeliveryAssignmentDetailSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    recipient_name = serializers.CharField(
        source="order.recipient_name", read_only=True
    )
    recipient_phone = serializers.CharField(
        source="order.recipient_phone", read_only=True
    )
    delivery_area_name = serializers.CharField(
        source="order.delivery_area_name", read_only=True
    )
    delivery_address_line = serializers.CharField(
        source="order.delivery_address_line", read_only=True
    )
    delivery_landmark = serializers.CharField(
        source="order.delivery_landmark", read_only=True
    )
    items = DeliveryOrderItemSerializer(source="order.items", many=True, read_only=True)
    delivery_staff_email = serializers.EmailField(
        source="delivery_staff.email", read_only=True
    )
    assigned_by_email = serializers.EmailField(
        source="assigned_by.email", read_only=True
    )

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order",
            "order_number",
            "recipient_name",
            "recipient_phone",
            "delivery_area_name",
            "delivery_address_line",
            "delivery_landmark",
            "items",
            "delivery_staff",
            "delivery_staff_email",
            "assigned_by",
            "assigned_by_email",
            "status",
            "assigned_at",
            "picked_up_at",
            "delivered_at",
            "failed_reason",
            "notes",
            "created_at",
            "updated_at",
        ]


class DeliveryAssignmentHistorySerializer(serializers.ModelSerializer):
    delivery_staff_email = serializers.EmailField(
        source="delivery_staff.email", read_only=True
    )
    assigned_by_email = serializers.EmailField(
        source="assigned_by.email", read_only=True
    )

    class Meta:
        model = DeliveryAssignmentHistory
        fields = [
            "id",
            "delivery",
            "delivery_staff",
            "delivery_staff_email",
            "assigned_by",
            "assigned_by_email",
            "assigned_at",
            "ended_at",
            "outcome",
            "failed_reason",
            "notes",
        ]
        read_only_fields = fields


class DutySessionSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = DutySession
        fields = [
            "id",
            "started_at",
            "ended_at",
            "is_active",
        ]
        read_only_fields = fields


class AdminDutyMonitoringSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    areas = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    duty_started_at = serializers.SerializerMethodField()
    active_delivery_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "is_active",
            "areas",
            "availability",
            "duty_started_at",
            "active_delivery_count",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def get_areas(self, obj):
        return [area.name for area in obj.delivery_areas.all()]

    def get_availability(self, obj):
        active_duty = getattr(obj, "active_duty", None)

        if not active_duty:
            return "OFFLINE"

        if getattr(obj, "active_delivery_count", 0) > 0:
            return "ON_DELIVERY"

        return "AVAILABLE"

    def get_duty_started_at(self, obj):
        active_duty = getattr(obj, "active_duty", None)

        return active_duty.started_at if active_duty else None

    def get_active_delivery_count(self, obj):
        return getattr(obj, "active_delivery_count", 0)
