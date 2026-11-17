from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):
    """
    Allow access only to Admin and Operations users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['ADMIN', 'OPERATIONS']
        )