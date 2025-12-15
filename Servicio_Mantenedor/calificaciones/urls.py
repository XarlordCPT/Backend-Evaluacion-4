from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router de DRF genera automáticamente CRUD endpoints
# Prefijo de URLs: /api/calificaciones/
# Frontend: NUAM/src/config/api.js - CALIFICACIONES endpoints

router = DefaultRouter()

# CRUD endpoints generados automáticamente:
# GET/POST /api/calificaciones/mercados/
# GET/PUT/DELETE /api/calificaciones/mercados/<id>/
router.register(r'mercados', views.MercadoViewSet)
router.register(r'tipos-agregacion', views.TipoAgregacionViewSet)
router.register(r'ejercicios', views.EjercicioViewSet)
router.register(r'instrumentos', views.InstrumentoViewSet)

# Calificaciones incluye endpoint personalizado: /cargar_csv/
# GET /api/calificaciones/calificaciones/ - Lista calificaciones del usuario
# POST /api/calificaciones/calificaciones/ - Crear calificación
# POST /api/calificaciones/calificaciones/cargar_csv/ - Carga masiva CSV
# GET/PUT/DELETE /api/calificaciones/calificaciones/<id>/ - Operaciones por ID
router.register(r'calificaciones', views.CalificacionViewSet, basename='calificacion')

# Reportes de auditoría - MOVIDO A SERVICIO REPORTES


urlpatterns = [
    path('', include(router.urls)),
    path('admin-login-token/', views.admin_login_token, name='admin_login_token'),
    path('admin-login/<str:temp_token>/', views.admin_login_redirect, name='admin_login_redirect'),
]
