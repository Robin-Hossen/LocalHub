from rest_framework.permissions import BasePermission


class IsAdminOrOperations(BasePermission):

    message = "Only Admin or Operations staff can manage inventory."

    def has_permission(self, request, view):

        user = request.user

        return (
            user
            and user.is_authenticated
            and user.role in ['ADMIN', 'OPERATIONS']
        )