
from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['ADMIN', 'OPERATIONS']
        )


class IsDeliveryStaff(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'DELIVERY'
        )


class IsAdminOperationsOrDelivery(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                'ADMIN',
                'OPERATIONS',
                'DELIVERY',
            ]
        )
