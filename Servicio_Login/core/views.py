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
from rest_framework.decorators import api_view, permission_classes
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
        # Llamar al mÃ©todo padre para obtener la respuesta estÃ¡ndar (tokens)
        response = super().post(request, *args, **kwargs)

        # Si el login fue exitoso (status 200), enviar evento a Kafka
        if response.status_code == 200:
            try:
                username = request.data.get('username') or request.data.get('email', 'unknown')
                
                # Intentar obtener el username real si se usÃ³ email
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
# Frontend: NUAM/src/services/authService.js - mÃ©todo login()
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
            {'detail': 'No tienes permisos para acceder al panel de administraciÃ³n.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generar un token temporal Ãºnico
    temp_token = secrets.token_urlsafe(32)
    
    # Almacenar el token en cache con la informaciÃ³n del usuario (vÃ¡lido por 5 minutos)
    # Aumentamos el tiempo para dar mÃ¡s margen al usuario
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
    Esta vista crea una sesiÃ³n HTTP de Django para que el usuario pueda acceder al admin.
    NO usa @api_view para poder manejar correctamente las cookies de sesiÃ³n.
    """
    # Verificar el token temporal
    user_id = cache.get(f'admin_login_{temp_token}')
    
    if not user_id:
        html_error = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Token InvÃ¡lido</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Token InvÃ¡lido o Expirado</h1>
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
            <p>No tienes permisos para acceder al panel de administraciÃ³n.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Eliminar el token temporal (solo se puede usar una vez)
    cache.delete(f'admin_login_{temp_token}')
    
    # Crear una sesiÃ³n de Django para el usuario y autenticarlo
    # login() automÃ¡ticamente crea una sesiÃ³n si no existe
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
            <h1>Error de AutenticaciÃ³n</h1>
            <p>No se pudo establecer la sesiÃ³n. Por favor, intenta nuevamente.</p>
            <p><a href="javascript:window.close()">Cerrar ventana</a></p>
        </body>
        </html>
        """
        return HttpResponseForbidden(html_error)
    
    # Asegurar que la sesiÃ³n se guarde
    # Django guarda automÃ¡ticamente la sesiÃ³n despuÃ©s de login(), pero lo forzamos explÃ­citamente
    request.session.save()
    
    # Redirigir al admin
    # Django redirect() automÃ¡ticamente establece las cookies de sesiÃ³n
    return redirect('/admin/')


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Endpoint: POST /api/auth/password-reset/request/
    Frontend: NUAM/src/services/authService.js - mÃ©todo requestPasswordReset()
    Recibe: { email: "usuario@ejemplo.com" }
    Retorna: { message: "...", user_id: 123 }
    EnvÃ­a cÃ³digo de 6 dÃ­gitos por email (vÃ¡lido 10 minutos)
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
            {'error': 'No existe un usuario asociado a este correo electrÃ³nico'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generar cÃ³digo de 6 dÃ­gitos
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Guardar cÃ³digo en cache con expiraciÃ³n de 10 minutos
    cache_key = f'password_reset_{usuario.id}'
    cache.set(cache_key, reset_code, timeout=600)
    
    # Enviar email con el cÃ³digo
    try:
        subject = 'CÃ³digo de recuperaciÃ³n de contraseÃ±a'
        message = f'''
Hola {usuario.username},

Se ha solicitado recuperar la contraseÃ±a de tu usuario. 

Tu cÃ³digo de verificaciÃ³n es: {reset_code}

Este cÃ³digo expirarÃ¡ en 10 minutos.

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
            {'error': 'Error al enviar el cÃ³digo. Por favor, intenta nuevamente.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(
        {
            'message': 'CÃ³digo de verificaciÃ³n enviado a tu correo electrÃ³nico',
            'user_id': usuario.id  # Necesario para la siguiente peticiÃ³n
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_reset_code(request):
    """
    Endpoint: POST /api/auth/password-reset/validate/
    Frontend: NUAM/src/services/authService.js - mÃ©todo validatePasswordResetCode()
    Recibe: { user_id: 123, code: "123456" }
    Retorna: { message: "CÃ³digo vÃ¡lido", valid: true }
    Valida el cÃ³digo antes de permitir cambio de contraseÃ±a (paso 2 del flujo)
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
    
    # Verificar cÃ³digo
    cache_key = f'password_reset_{usuario.id}'
    stored_code = cache.get(cache_key)
    
    if not stored_code:
        return Response(
            {'error': 'CÃ³digo expirado o invÃ¡lido. Por favor, solicita un nuevo cÃ³digo.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_code != code:
        return Response(
            {'error': 'CÃ³digo incorrecto'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # CÃ³digo vÃ¡lido
    return Response(
        {'message': 'CÃ³digo vÃ¡lido', 'valid': True},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """
    Endpoint: POST /api/auth/password-reset/verify/
    Frontend: NUAM/src/services/authService.js - mÃ©todo verifyPasswordReset()
    Recibe: { user_id: 123, code: "123456", new_password: "nueva_clave" }
    Retorna: { message: "ContraseÃ±a actualizada exitosamente" }
    Paso 3: Verifica cÃ³digo y cambia la contraseÃ±a
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
            {'error': 'La nueva contraseÃ±a es requerida'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'La contraseÃ±a debe tener al menos 8 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar cÃ³digo
    cache_key = f'password_reset_{usuario.id}'
    stored_code = cache.get(cache_key)
    
    if not stored_code:
        return Response(
            {'error': 'CÃ³digo expirado o invÃ¡lido. Por favor, solicita un nuevo cÃ³digo.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_code != code:
        return Response(
            {'error': 'CÃ³digo incorrecto'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # CÃ³digo vÃ¡lido, cambiar contraseÃ±a
    usuario.set_password(new_password)
    usuario.save()
    
    # Eliminar cÃ³digo de cache (solo se puede usar una vez)
    cache.delete(cache_key)
    
    return Response(
        {'message': 'ContraseÃ±a actualizada exitosamente'},
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
