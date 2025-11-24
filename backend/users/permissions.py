from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission class for admin users only."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsAdminOrOperations(permissions.BasePermission):
    """Allow access to administrators or operations (former seller) roles."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_operations)
        )


class IsAdminOrVendor(permissions.BasePermission):
    """Allow access to administrators or vendor (former designer) roles."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_vendor)
        )


class IsAdminOperationsOrVendor(permissions.BasePermission):
    """Allow access to administrators, operations or vendor roles."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_operations or request.user.is_vendor)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission class for resource owner or admin."""
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj == request.user
