from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import ProductCategory, Product, StockMovement
from .serializers import (
    ProductCategorySerializer, ProductSerializer, 
    ProductListSerializer, StockMovementSerializer
)
from users.permissions import IsAdminOrSeller


class ProductCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for ProductCategory CRUD operations."""
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations."""
    queryset = Product.objects.select_related('category').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'unit_measure']
    search_fields = ['name', 'sku', 'description', 'supplier']
    ordering_fields = ['created_at', 'name', 'quantity_available', 'unit_price']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock."""
        low_stock_products = [p for p in self.get_queryset() if p.is_low_stock]
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete: deactivate product instead of deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(
            {'message': 'Producto desactivado correctamente'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get products out of stock."""
        out_of_stock = self.get_queryset().filter(quantity_available=0)
        serializer = self.get_serializer(out_of_stock, many=True)
        return Response(serializer.data)


class StockMovementViewSet(viewsets.ModelViewSet):
    """ViewSet for StockMovement operations."""
    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
