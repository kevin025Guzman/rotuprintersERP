from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import SimpleProduct, StockMovement
from .serializers import (
    SimpleProductSerializer,
    SimpleProductListSerializer,
    StockMovementSerializer,
    StockAdjustmentSerializer,
)
from .permissions import IsAdminOrReadOnly, IsAdminOrSeller, IsAdminOrSellerOrReadOnly


class SimpleProductViewSet(viewsets.ModelViewSet):
    """CRUD de productos con inventario manual."""

    queryset = SimpleProduct.objects.all().order_by('name')
    permission_classes = [IsAdminOrSellerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'quantity', 'created_at']
    filterset_fields = ['sku']

    def get_serializer_class(self):
        if self.action == 'list':
            return SimpleProductListSerializer
        return SimpleProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        min_quantity = self.request.query_params.get('min_quantity')
        max_quantity = self.request.query_params.get('max_quantity')

        if min_quantity not in (None, ''):
            try:
                queryset = queryset.filter(quantity__gte=int(min_quantity))
            except ValueError:
                pass
        if max_quantity not in (None, ''):
            try:
                queryset = queryset.filter(quantity__lte=int(max_quantity))
            except ValueError:
                pass
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrSeller])
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')

        if quantity < 0 and abs(quantity) > product.quantity:
            return Response(
                {'detail': 'La cantidad a restar excede el inventario disponible.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        movement_type = (
            StockMovement.MovementType.ENTRY
            if quantity > 0
            else StockMovement.MovementType.EXIT
        )

        StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=abs(quantity),
            notes=notes,
            created_by=request.user,
        )

        product.refresh_from_db()
        response_serializer = SimpleProductSerializer(product)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class StockMovementViewSet(viewsets.ModelViewSet):
    """Listado y creación de movimientos históricos de inventario."""

    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSeller]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
