from django.contrib import admin
from django.urls import path
from .views import (
    MyTokenObtainPairView, 
    admin_login_token, 
    admin_login_redirect,
    request_password_reset,
    validate_reset_code,
    verify_reset_code,
    get_user_profile,
    logout_view
)
from rest_framework_simplejwt.views import (TokenRefreshView, TokenVerifyView)

# URLs de autenticación - Prefijo: /api/auth/
# Frontend: NUAM/src/config/api.js - AUTH endpoints
urlpatterns = [
    # POST /api/auth/token/ - Login, retorna JWT tokens
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # POST /api/auth/token/refresh/ - Refrescar access token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # POST /api/auth/token/verify/ - Verificar token
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # GET /api/auth/admin-login-token/ - Obtener token temporal para admin
    path('admin-login-token/', admin_login_token, name='admin_login_token'),
    # GET /api/auth/admin-login/<token>/ - Redirige al admin con sesión
    path('admin-login/<str:temp_token>/', admin_login_redirect, name='admin_login_redirect'),
    # POST /api/auth/password-reset/request/ - Solicitar código de recuperación
    path('password-reset/request/', request_password_reset, name='password_reset_request'),
    # POST /api/auth/password-reset/validate/ - Validar código (paso 2)
    path('password-reset/validate/', validate_reset_code, name='validate_reset_code'),
    # POST /api/auth/password-reset/verify/ - Cambiar contraseña (paso 3)
    path('password-reset/verify/', verify_reset_code, name='password_reset_verify'),
    # GET /api/auth/profile/ - Obtener perfil del usuario autenticado
    path('profile/', get_user_profile, name='get_user_profile'),
    # POST /api/auth/logout/ - Cierre de sesión (solo auditoría)
    path('logout/', logout_view, name='logout'),
]
