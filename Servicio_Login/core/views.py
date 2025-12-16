from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import secrets
import json
import random
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from django.conf import settings
from .serializers import MyTokenObtainPairSerializer
from .models import Usuario
from utils.kafka_client import KafkaProducerClient
from datetime import datetime

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Llamar al método padre para obtener la respuesta estándar (tokens)
        response = super().post(request, *args, **kwargs)

        # Si el login fue exitoso (status 200), enviar evento a Kafka
        if response.status_code == 200:
            try:
                username = request.data.get('username') or request.data.get('email', 'unknown')
                
                # Intentar obtener el username real si se usó email
                if '@' in username: 
                    try:
                        user = Usuario.objects.get(email=username)
                        username = user.username
                    except Usuario.DoesNotExist:
                        pass

                payload = {
                    'usuario': username,
                    'accion': 'Inicio de sesi\u00F3n',
                    'origen': 'login',
                    'fecha': datetime.now().isoformat()
                }
                
                client = KafkaProducerClient()
                client.send_message(settings.KAFKA_TOPIC_REPORTES, payload)
                
            except Exception as e:
                # No bloquear el login si falla Kafka
                print(f"Error enviando evento login a Kafka: {e}")

        return response

# Endpoint de login: POST /api/auth/token/
# Frontend: NUAM/src/services/authService.js - método login()
# Recibe: { username, password }
# Retorna: { access: "token", refresh: "token" }
# Guarda tokens en localStorage del frontend

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_login_token(request):
    """
    Endpoint: GET /api/auth/admin-login-token/
    Frontend: Usado para obtener token temporal para acceder al admin de Django
    Retorna: { temp_token: "...", admin_login_url: "/api/auth/admin-login/<token>/" }
    """
    user = request.user
    
    # Verificar que el usuario tenga is_staff=True
    if not user.is_staff:
        return Response(
            {'detail': 'No tienes permisos para acceder al panel de administración.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generar un token temporal único
    temp_token = secrets.token_urlsafe(32)
    
    # Almacenar el token en cache con la información del usuario (válido por 5 minutos)
    # Aumentamos el tiempo para dar más margen al usuario
    cache.set(f'admin_login_{temp_token}', user.id, timeout=300)
    
    # Devolver el token temporal
    admin_login_url = f'/api/auth/admin-login/{temp_token}/'
    return Response({
        'temp_token': temp_token,
        'admin_login_url': admin_login_url
    })


@csrf_exempt
def admin_login_redirect(request, temp_token):
    """
    Vista que autentica al usuario usando un token temporal y lo redirige al admin.
    Esta vista crea una sesión HTTP de Django para que el usuario pueda acceder al admin.
    NO usa @api_view para poder manejar correctamente las cookies de sesión.
    """
    # Verificar el token temporal
    user_id = cache.get(f'admin_login_{temp_token}')
    
    if not user_id:
        html_error = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Token Inválido</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Token Inválido o Expirado</h1>
            <p>El token de acceso ha expirado. Por favor, intenta nuevamente.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Obtener el usuario
    try:
        user = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        html_error = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Usuario No Encontrado</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Usuario No Encontrado</h1>
            <p>El usuario asociado con este token no existe.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Verificar que el usuario tenga is_staff=True
    if not user.is_staff:
        html_error = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Acceso Denegado</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Acceso Denegado</h1>
            <p>No tienes permisos para acceder al panel de administración.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Eliminar el token temporal (solo se puede usar una vez)
    cache.delete(f'admin_login_{temp_token}')
    
    # Crear una sesión de Django para el usuario y autenticarlo
    # login() automáticamente crea una sesión si no existe
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    
    # Verificar que el login fue exitoso
    if not request.user.is_authenticated:
        html_error = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error de AutenticaciÃ³n</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Error de Autenticación</h1>
            <p>No se pudo establecer la sesión. Por favor, intenta nuevamente.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Asegurar que la sesión se guarde
    # Django guarda automáticamente la sesión después de login(), pero lo forzamos explícitamente
    request.session.save()
    
    # Redirigir al admin
    # Django redirect() automáticamente establece las cookies de sesión
    return redirect('/admin/')


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Endpoint: POST /api/auth/password-reset/request/
    Frontend: NUAM/src/services/authService.js - método requestPasswordReset()
    Recibe: { email: "usuario@ejemplo.com" }
    Retorna: { message: "...", user_id: 123 }
    Envía código de 6 dígitos por email (válido 10 minutos)
    """
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response(
            {'error': 'El email es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Buscar usuario por email
        usuario = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        # No revelar si el email existe o no por seguridad
        # Pero el usuario pidiÃ³ mostrar error si no existe
        return Response(
            {'error': 'No existe un usuario asociado a este correo electrónico'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generar cÃ³digo de 6 dÃ­gitos
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Guardar cÃ³digo en cache con expiraciÃ³n de 10 minutos
    # Guardar código en cache con expiración de 10 minutos
    cache_key = f'password_reset_{usuario.id}'
    cache.set(cache_key, reset_code, timeout=600)
    
    # Enviar email con el código
    try:
        subject = 'Código de recuperación de contraseña'
        message = f'''
Hola {usuario.username},

Se ha solicitado recuperar la contraseña de tu usuario. 

Tu código de verificación es: {reset_code}

Este código expirará en 10 minutos.

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
Equipo Desarrollo Proyecto NUAM
'''
        from_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@nuam.com'
        send_mail(
            subject,
            message,
            from_email,
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print(f'Error al enviar email: {e}')
        return Response(
            {'error': 'Error al enviar el código. Por favor, intenta nuevamente.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(
        {
            'message': 'Código de verificación enviado a tu correo electrónico',
            'user_id': usuario.id  # Necesario para la siguiente petición
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_reset_code(request):
    """
    Endpoint: POST /api/auth/password-reset/validate/
    Frontend: NUAM/src/services/authService.js - método validatePasswordResetCode()
    Recibe: { user_id: 123, code: "123456" }
    Retorna: { message: "Código válido", valid: true }
    Valida el código antes de permitir cambio de contraseña (paso 2 del flujo)
    """
    user_id = request.data.get('user_id')
    code = request.data.get('code', '').strip()
    
    if not user_id or not code:
        return Response(
            {'error': 'user_id y code son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar código
    cache_key = f'password_reset_{usuario.id}'
    stored_code = cache.get(cache_key)
    
    if not stored_code:
        return Response(
            {'error': 'Código expirado o inválido. Por favor, solicita un nuevo código.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_code != code:
        return Response(
            {'error': 'Código incorrecto'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Código válido
    return Response(
        {'message': 'Código válido', 'valid': True},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """
    Endpoint: POST /api/auth/password-reset/verify/
    Frontend: NUAM/src/services/authService.js - método verifyPasswordReset()
    Recibe: { user_id: 123, code: "123456", new_password: "nueva_clave" }
    Retorna: { message: "Contraseña actualizada exitosamente" }
    Paso 3: Verifica código y cambia la contraseña
    """
    user_id = request.data.get('user_id')
    code = request.data.get('code', '').strip()
    new_password = request.data.get('new_password', '').strip()
    
    if not user_id or not code:
        return Response(
            {'error': 'user_id y code son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not new_password:
        return Response(
            {'error': 'La nueva contraseña es requerida'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'La contraseña debe tener al menos 8 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar código
    cache_key = f'password_reset_{usuario.id}'
    stored_code = cache.get(cache_key)
    
    if not stored_code:
        return Response(
            {'error': 'Código expirado o inválido. Por favor, solicita un nuevo código.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_code != code:
        return Response(
            {'error': 'Código incorrecto'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Código válido, cambiar contraseña
    usuario.set_password(new_password)
    usuario.save()
    
    # Eliminar código de cache (solo se puede usar una vez)
    cache.delete(cache_key)
    
    return Response(
        {'message': 'Contraseña actualizada exitosamente'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Endpoint: GET /api/auth/profile/
    Frontend: NUAM/src/pages/Perfil.jsx - carga datos del usuario
    Headers: Authorization: Bearer <token>
    Retorna: { id, username, email, rol, is_staff, ... }
    """
    user = request.user
    
    profile_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name or '',
        'last_name': user.last_name or '',
        'is_staff': user.is_staff,
        'is_active': user.is_active,
        'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S') if user.date_joined else None,
        'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
    }
    
    if user.rol:
        profile_data['rol'] = {
            'id': user.rol.id_rol,
            'nombre': user.rol.nombre_rol
        }
    else:
        profile_data['rol'] = None
    
    if hasattr(user, 'empleado') and user.empleado:
        profile_data['empleado'] = {
            'id': user.empleado.id_empleado,
            'rut': user.empleado.rut
        }
    else:
        profile_data['empleado'] = None
    
    return Response(profile_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Endpoint: POST /api/auth/logout/
    Desc: Registra el evento de cierre de sesión en Kafka.
    Header: Authorization: Bearer <token>
    """
    try:
        user = request.user
        payload = {
            'usuario': user.username,
            'accion': 'Cierre de sesi\u00F3n',
            'origen': 'login',
            'fecha': datetime.now().isoformat()
        }
        
        client = KafkaProducerClient()
        client.send_message(settings.KAFKA_TOPIC_REPORTES, payload)
    except Exception as e:
        print(f'Error enviando evento logout a Kafka: {e}')
    
    return Response({'message': 'Sesión cerrada exitosamente'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Endpoint para estadísticas del dashboard de administración de Login.
    """
    if not request.user.is_staff:
        return HttpResponseForbidden("Acceso denegado")

    total_usuarios = Usuario.objects.count()
    usuarios_activos = Usuario.objects.filter(is_active=True).count()
    usuarios_staff = Usuario.objects.filter(is_staff=True).count()
    
    # Usuarios recientes
    usuarios_recientes = Usuario.objects.order_by('-date_joined')[:5]
    recientes_data = [
        {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'fecha_registro': u.date_joined.strftime('%Y-%m-%d %H:%M') if u.date_joined else 'N/A',
            'is_active': u.is_active
        }
        for u in usuarios_recientes
    ]

    return JsonResponse({
        'totales': {
            'usuarios': total_usuarios,
            'activos': usuarios_activos,
            'staff': usuarios_staff
        },
        'usuarios_recientes': recientes_data
    })
