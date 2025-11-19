from django.contrib import admin
from .models import Quotation, QuotationItem


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1
    readonly_fields = ['square_inches', 'total']


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = [
        'quotation_number', 'client', 'status', 'total_amount',
        'created_by', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['quotation_number', 'client__name', 'client__company']
    readonly_fields = ['quotation_number', 'subtotal', 'discount_amount', 'total_amount']
    inlines = [QuotationItemInline]
    ordering = ['-created_at']


@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = ['quotation', 'product', 'width_inches', 'height_inches', 'quantity', 'total']
    readonly_fields = ['square_inches', 'total']
