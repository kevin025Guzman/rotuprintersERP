from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    readonly_fields = ['square_inches', 'total']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'client', 'status', 'payment_method',
        'total_amount', 'created_by', 'created_at'
    ]
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'client__name', 'client__company']
    readonly_fields = [
        'invoice_number', 'subtotal', 'tax_amount',
        'discount_amount', 'total_amount', 'completed_at'
    ]
    inlines = [SaleItemInline]
    ordering = ['-created_at']


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'product', 'quantity', 'unit_price', 'total']
    readonly_fields = ['square_inches', 'total']
