from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuotationViewSet, QuotationItemViewSet

router = DefaultRouter()
router.register(r'', QuotationViewSet, basename='quotation')
router.register(r'items', QuotationItemViewSet, basename='quotation-item')

urlpatterns = [
    path('', include(router.urls)),
]
