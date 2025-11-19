from rest_framework import serializers
from .models import SimpleProduct, StockMovement
from users.serializers import UserSerializer

class SimpleProductSerializer(serializers.ModelSerializer):
    """Serializer for SimpleProduct model (detail view)."""
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = SimpleProduct
        fields = [
            'id', 'name', 'description', 'sku', 
            'quantity', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class SimpleProductListSerializer(serializers.ModelSerializer):
    """Serializer for SimpleProduct model (list view)."""
    class Meta:
        model = SimpleProduct
        fields = ['id', 'name', 'sku', 'quantity', 'created_at']


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for StockMovement model."""
    created_by = UserSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type',
            'quantity', 'notes', 'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment."""
    quantity = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
