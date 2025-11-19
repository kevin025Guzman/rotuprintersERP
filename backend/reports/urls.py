from django.urls import path
from .views import (
    DashboardStatsView, SalesReportView, InventoryReportView,
    QuotationsReportView, ClientsReportView, DailySalesPDFView, TotalSalesPDFView
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('inventory/', InventoryReportView.as_view(), name='inventory-report'),
    path('quotations/', QuotationsReportView.as_view(), name='quotations-report'),
    path('clients/', ClientsReportView.as_view(), name='clients-report'),
    path('daily-sales-pdf/', DailySalesPDFView.as_view(), name='daily-sales-pdf'),
    path('total-sales-pdf/', TotalSalesPDFView.as_view(), name='total-sales-pdf'),
]
