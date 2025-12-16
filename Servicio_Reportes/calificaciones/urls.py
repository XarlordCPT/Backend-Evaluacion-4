from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Reportes de auditoria - Solo lectura para administradores
router.register(r'reportes', views.ReporteViewSet, basename='reporte')

urlpatterns = [
    path('', include(router.urls)),
    path('admin-login-token/', views.admin_login_token, name='admin_login_token'),
    path('admin-login/<str:temp_token>/', views.admin_login_redirect, name='admin_login_redirect'),
]
