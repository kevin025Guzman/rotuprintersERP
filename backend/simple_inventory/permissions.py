from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    """
    Permiso personalizado que permite solo a los administradores crear, actualizar o eliminar.
    Cualquier usuario autenticado puede ver los productos.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsAdminOrSeller(BasePermission):
    """
    Permiso que permite a administradores y vendedores realizar acciones.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in ['ADMIN', 'SELLER']
        )
