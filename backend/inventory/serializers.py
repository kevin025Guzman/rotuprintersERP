from rest_framework import serializers
from .models import ProductCategory, Product, StockMovement


class ProductCategorySerializer(serializers.ModelSerializer):
    """Serializer for ProductCategory model."""
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'created_at', 'product_count']
        read_only_fields = ['id', 'created_at']
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'description', 'sku',
            'unit_measure', 'quantity_available', 'unit_cost', 'unit_price',
            'price_per_square_inch', 'supplier', 'minimum_stock', 'is_active',
            'is_low_stock', 'stock_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sku', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category_name', 'sku', 'unit_measure',
            'quantity_available', 'unit_price', 'price_per_square_inch',
            'stock_status', 'is_active'
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for StockMovement model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'reference', 'notes', 'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def create(self, validated_data):
        # Set the user who created the movement
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
