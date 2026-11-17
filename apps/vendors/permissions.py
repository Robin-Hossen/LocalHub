from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):
    message = "Only Admin and Operations staff can access vendors."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "OPERATIONS"]
        )


class IsAdminRole(BasePermission):
    message = "Only Admin can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )