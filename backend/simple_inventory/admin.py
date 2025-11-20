from django.contrib import admin

from .models import SimpleProduct, StockMovement


@admin.register(SimpleProduct)
class SimpleProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'quantity', 'created_at', 'created_by')
    search_fields = ('name', 'description', 'sku')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'created_by', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('product__name', 'notes')
    readonly_fields = ('created_at',)
