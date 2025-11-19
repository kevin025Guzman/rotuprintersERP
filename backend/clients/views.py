from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Client
from .serializers import ClientSerializer, ClientListSerializer
from users.permissions import IsAdminOrSeller


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for Client CRUD operations."""
    queryset = Client.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'company', 'phone', 'email', 'rtn']
    ordering_fields = ['created_at', 'name', 'company']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer
