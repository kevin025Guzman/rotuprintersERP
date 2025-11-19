from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission class for admin users only."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsAdminOrSeller(permissions.BasePermission):
    """Permission class for admin and seller users."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_seller)
        )


class IsAdminOrDesigner(permissions.BasePermission):
    """Permission class for admin and designer users."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_designer)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission class for resource owner or admin."""
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj == request.user
