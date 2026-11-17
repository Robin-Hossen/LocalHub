from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):

    message = "Only customers can manage delivery addresses."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )