from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.SimpleProductViewSet, basename='simple-product')
router.register(r'stock-movements', views.StockMovementViewSet, basename='stock-movement')

urlpatterns = [
    path('', include(router.urls)),
]
