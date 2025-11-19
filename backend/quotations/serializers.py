from rest_framework import serializers
from .models import Quotation, QuotationItem
from clients.serializers import ClientListSerializer
from inventory.serializers import ProductListSerializer


class QuotationItemSerializer(serializers.ModelSerializer):
    """Serializer for QuotationItem model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = QuotationItem
        fields = [
            'id', 'product', 'product_name', 'description',
            'width_inches', 'height_inches', 'square_inches',
            'price_per_square_inch', 'quantity', 'total'
        ]
        read_only_fields = ['id', 'square_inches', 'total']


class QuotationSerializer(serializers.ModelSerializer):
    """Serializer for Quotation model."""
    items = QuotationItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'client', 'client_name',
            'created_by', 'created_by_username', 'status',
            'subtotal', 'discount_percentage', 'discount_amount',
            'total_amount', 'notes', 'valid_until',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'quotation_number', 'created_by',
            'subtotal', 'discount_amount', 'total_amount',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        quotation = Quotation.objects.create(**validated_data)
        
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        
        quotation.calculate_totals()
        return quotation
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            # Delete existing items and create new ones
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
        
        instance.calculate_totals()
        return instance


class QuotationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for quotation lists."""
    client_name = serializers.CharField(source='client.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'client_name', 'created_by_username',
            'status', 'total_amount', 'created_at', 'items_count'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
