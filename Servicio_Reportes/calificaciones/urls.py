from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router de DRF genera automáticamente CRUD endpoints
# Prefijo de URLs: /api/calificaciones/
# Frontend: NUAM/src/config/api.js - CALIFICACIONES endpoints

router = DefaultRouter()

# Reportes de auditoría - Solo lectura para administradores
# GET /api/calificaciones/reportes/ - Lista todos los reportes
# GET /api/calificaciones/reportes/<id>/ - Obtiene un reporte específico
router.register(r'reportes', views.ReporteViewSet, basename='reporte')

urlpatterns = [
    path('', include(router.urls)),
    path('admin-login-token/', views.admin_login_token, name='admin_login_token'),
    path('admin-login/<str:temp_token>/', views.admin_login_redirect, name='admin_login_redirect'),
]
