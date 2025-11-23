"""
URL configuration for rotuprinters project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger/ReDoc Configuration
schema_view = get_schema_view(
    openapi.Info(
        title="RotuPrinters API",
        default_version='v1',
        description="API para el sistema de gestión de RotuPrinters - Empresa de diseño gráfico, rotulación e impresión",
        terms_of_service="https://www.rotuprinters.com/terms/",
        contact=openapi.Contact(email="info@rotuprinters.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API URLs
    path('api/users/', include('users.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/simple-inventory/', include('simple_inventory.urls')),
    path('api/quotations/', include('quotations.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/expenses/', include('expenses.urls')),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='spa-entry'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
