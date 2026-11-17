from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['ADMIN', 'OPERATIONS']
        )


class IsCustomer(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'CUSTOMER'
        )