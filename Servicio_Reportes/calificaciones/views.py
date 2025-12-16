from django.shortcuts import render, redirect
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Reporte, Usuario
from .serializers import ReporteSerializer
import secrets
from django.core.cache import cache
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseForbidden, JsonResponse
import logging
from django.db.models import Count
from django.db.models.functions import TruncDay
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

class ReporteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para reportes de auditoria.
    Solo lectura, accesible unicamente para administradores.
    """
    serializer_class = ReporteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Verificar que el usuario sea administrador
        user = self.request.user
        if not user.is_authenticated:
            return Reporte.objects.none()
        
        # Verificar si es administrador por rol o is_staff
        is_admin = False
        if user.is_staff:
            is_admin = True
        elif user.rol and user.rol.nombre_rol.lower() == "administrador":
            is_admin = True
        
        if not is_admin:
            return Reporte.objects.none()
        
        # Retornar todos los reportes ordenados por fecha descendente
        return Reporte.objects.select_related('usuario').order_by('-fecha')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_login_token(request):
    """
    Endpoint: GET /api/calificaciones/admin-login-token/
    Frontend: Usado para obtener token temporal para acceder al admin de Django
    Retorna: { temp_token: "...", admin_login_url: "/api/calificaciones/admin-login/<token>/" }
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
    cache.set(f'admin_login_{temp_token}', user.id, timeout=300)
    
    # Devolver el token temporal
    admin_login_url = f'/api/calificaciones/admin-login/{temp_token}/'
    return Response({
        'temp_token': temp_token,
        'admin_login_url': admin_login_url
    })

@csrf_exempt
def admin_login_redirect(request, temp_token):
    """
    Vista que autentica al usuario usando un token temporal y lo redirige al admin.
    """
    # Verificar el token temporal
    user_id = cache.get(f'admin_login_{temp_token}')
    
    if not user_id:
        return HttpResponseForbidden("Token Inválido o Expirado")
    
    # Obtener el usuario
    try:
        user = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return HttpResponseForbidden("Usuario No Encontrado")
    
    # Verificar que el usuario tenga is_staff=True
    if not user.is_staff:
        return HttpResponseForbidden("Acceso Denegado")
    
    # Eliminar el token temporal
    cache.delete(f'admin_login_{temp_token}')
    
    # Autenticar al usuario
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    request.session.save()
    
    # Redirigir al admin
    return redirect('/admin/')


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Endpoint para estadísticas del dashboard de administración de Reportes.
    """
    if not request.user.is_staff:
        return HttpResponseForbidden("Acceso denegado")

    # Actividad reciente
    reportes_recientes = Reporte.objects.select_related('usuario').order_by('-fecha')[:10]
    recientes_data = [
        {
            'id': r.id_reporte,
            'usuario': r.usuario.username if r.usuario else 'Sistema',
            'accion': r.accion,
            'fecha': r.fecha.strftime('%Y-%m-%d %H:%M')
        }
        for r in reportes_recientes
    ]

    # Gráfico de actividad por día (últimos 30 días)
    fecha_limite = timezone.now() - timedelta(days=30)
    actividad_diaria = Reporte.objects.filter(fecha__gte=fecha_limite).annotate(
        dia=TruncDay('fecha')
    ).values('dia').annotate(
        count=Count('id_reporte')
    ).order_by('dia')

    grafico_data = [
        {
            'fecha': item['dia'].strftime('%Y-%m-%d') if item['dia'] else 'N/A',
            'count': item['count']
        }
        for item in actividad_diaria
    ]

    return JsonResponse({
        'actividad_reciente': recientes_data,
        'grafico_actividad': grafico_data
    })