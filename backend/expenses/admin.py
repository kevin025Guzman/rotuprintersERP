from django.contrib import admin

from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'date', 'amount', 'created_by', 'created_at')
    list_filter = ('date', 'created_by')
    search_fields = ('description',)
