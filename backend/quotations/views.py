from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Quotation, QuotationItem
from .serializers import (
    QuotationSerializer, QuotationListSerializer, QuotationItemSerializer
)
from users.permissions import IsAdminOrSeller


class QuotationViewSet(viewsets.ModelViewSet):
    """ViewSet for Quotation CRUD operations."""
    queryset = Quotation.objects.select_related('client', 'created_by').prefetch_related('items').all()
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'created_by']
    search_fields = ['quotation_number', 'client__name', 'client__company']
    ordering_fields = ['created_at', 'total_amount', 'quotation_number']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return QuotationListSerializer
        return QuotationSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a quotation."""
        quotation = self.get_object()
        if quotation.status == Quotation.Status.CONVERTED:
            return Response(
                {'error': 'Esta cotización ya fue convertida a venta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        quotation.status = Quotation.Status.APPROVED
        quotation.save()
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a quotation."""
        quotation = self.get_object()
        quotation.status = Quotation.Status.REJECTED
        quotation.save()
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def convert_to_sale(self, request, pk=None):
        """Convert quotation to sale (handled in sales app)."""
        quotation = self.get_object()
        if quotation.status == Quotation.Status.CONVERTED:
            return Response(
                {'error': 'Esta cotización ya fue convertida a venta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # This will be handled by the sales endpoint
        return Response({
            'message': 'Use POST /api/sales/from_quotation/ with quotation_id',
            'quotation_id': quotation.id
        })


class QuotationItemViewSet(viewsets.ModelViewSet):
    """ViewSet for QuotationItem operations."""
    queryset = QuotationItem.objects.select_related('quotation', 'product').all()
    serializer_class = QuotationItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        quotation_id = self.request.query_params.get('quotation_id')
        if quotation_id:
            queryset = queryset.filter(quotation_id=quotation_id)
        return queryset
