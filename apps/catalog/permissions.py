from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):
    message = "Only Admin or Operations staff can manage products."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "OPERATIONS"]
        )