from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'description', 'date', 'amount', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        full_name = (obj.created_by.get_full_name() or '').strip()
        return full_name or obj.created_by.username
