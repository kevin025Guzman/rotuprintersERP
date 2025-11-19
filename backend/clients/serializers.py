from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model."""
    total_sales = serializers.ReadOnlyField()
    total_quotations = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company', 'phone', 'email', 'address', 
            'rtn', 'notes', 'is_active', 'created_at', 'updated_at',
            'total_sales', 'total_quotations'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClientListSerializer(serializers.ModelSerializer):
    """Simplified serializer for client lists."""
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company', 'phone', 'email', 'is_active'
        ]
