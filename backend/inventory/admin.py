from django.contrib import admin
from .models import ProductCategory, Product, StockMovement


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'sku', 'quantity_available', 
        'unit_price', 'stock_status', 'is_active'
    ]
    list_filter = ['category', 'is_active', 'unit_measure']
    search_fields = ['name', 'sku', 'supplier']
    ordering = ['name']
    list_per_page = 25


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reference', 'created_by', 'created_at']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['product__name', 'reference']
    ordering = ['-created_at']
    list_per_page = 25
