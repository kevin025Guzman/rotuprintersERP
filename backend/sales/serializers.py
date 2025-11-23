from rest_framework import serializers
from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for SaleItem model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'description',
            'width_inches', 'height_inches', 'square_inches',
            'unit_price', 'quantity', 'quantity_used', 'total'
        ]
        read_only_fields = ['id', 'square_inches', 'total']


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model."""
    items = SaleItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    quotation_number = serializers.CharField(source='quotation.quotation_number', read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_number', 'client', 'client_name',
            'quotation', 'quotation_number', 'created_by', 'created_by_username',
            'status', 'payment_method', 'subtotal', 'tax_rate', 'tax_amount',
            'discount_percentage', 'discount_amount', 'total_amount',
            'notes', 'created_at', 'updated_at', 'completed_at', 'items'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'created_by', 'subtotal',
            'tax_amount', 'discount_amount', 'total_amount',
            'created_at', 'updated_at', 'completed_at'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        sale = Sale.objects.create(**validated_data)
        
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        
        sale.calculate_totals()
        return sale
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            # Delete existing items and create new ones
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)
        
        instance.calculate_totals()
        return instance


class SaleListSerializer(serializers.ModelSerializer):
    """Simplified serializer for sale lists."""
    client_name = serializers.CharField(source='client.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_number', 'client_name', 'created_by_username',
            'status', 'payment_method', 'notes', 'total_amount', 'created_at', 'items_count'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class CreateSaleFromQuotationSerializer(serializers.Serializer):
    """Serializer for creating a sale from a quotation."""
    quotation_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(
        choices=Sale.PaymentMethod.choices,
        default=Sale.PaymentMethod.CASH
    )
    notes = serializers.CharField(required=False, allow_blank=True)
