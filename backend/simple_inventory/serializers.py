from rest_framework import serializers

from users.serializers import UserSerializer
from .models import SimpleProduct, StockMovement


class SimpleProductSerializer(serializers.ModelSerializer):
    """Serializer for SimpleProduct model (detail view)."""

    created_by = UserSerializer(read_only=True)

    class Meta:
        model = SimpleProduct
        fields = [
            'id', 'name', 'description', 'sku',
            'quantity', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class SimpleProductListSerializer(serializers.ModelSerializer):
    """Serializer for SimpleProduct model (list view)."""

    class Meta:
        model = SimpleProduct
        fields = ['id', 'name', 'description', 'sku', 'quantity', 'created_at']


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
        read_only_fields = ['id', 'created_at', 'created_by']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor que cero.')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment requests."""

    quantity = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError('La cantidad no puede ser cero.')
        return value
