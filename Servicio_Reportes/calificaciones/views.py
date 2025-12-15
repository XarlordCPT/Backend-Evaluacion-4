from django.db.models.signals import pre_delete
from django.shortcuts import render, redirect
import secrets
from django.core.cache import cache
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseForbidden, HttpResponse
from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from datetime import datetime, timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal, InvalidOperation
from .models import (Calificacion, Factor, Instrumento, Mercado, TipoAgregacion, Ejercicio, Reporte, Usuario)
from .serializers import (CalificacionSerializer, FactorSerializer, InstrumentoSerializer, MercadoSerializer, TipoAgregacionSerializer, EjercicioSerializer, ReporteSerializer)
from .signals import set_current_user

class MercadoViewSet(viewsets.ModelViewSet):
    queryset = Mercado.objects.all()
    serializer_class = MercadoSerializer
    permission_classes = [permissions.AllowAny]

class TipoAgregacionViewSet(viewsets.ModelViewSet):
    queryset = TipoAgregacion.objects.all()
    serializer_class = TipoAgregacionSerializer
    permission_classes = [permissions.AllowAny]

class EjercicioViewSet(viewsets.ModelViewSet):
    queryset = Ejercicio.objects.all()
    serializer_class = EjercicioSerializer
    permission_classes = [permissions.AllowAny]

class InstrumentoViewSet(viewsets.ModelViewSet):
    queryset = Instrumento.objects.all()
    serializer_class = InstrumentoSerializer
    permission_classes = [permissions.AllowAny]

class CalificacionViewSet(viewsets.ModelViewSet):
    serializer_class = CalificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Calificacion.objects.filter(
            usuario=self.request.user
        ).prefetch_related('factores')
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def destroy(self, request, *args, **kwargs):
        """Sobrescribir destroy para establecer el usuario antes de eliminar"""
        instance = self.get_object()
        # Establecer usuario en thread-local para las señales
        set_current_user(request.user)
        try:
            return super().destroy(request, *args, **kwargs)
        finally:
            # Limpiar el usuario del thread-local
            set_current_user(None)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cargar_csv(self, request):
        """
        Endpoint: POST /api/calificaciones/calificaciones/cargar_csv/
        Frontend: NUAM/src/services/calificacionesService.js - método cargarCSV()
        Recibe: { datos: [{ ejercicio, mercado, instrumento, fechaPago, factores... }, ...] }
        Retorna: { exitosas: [...], errores: [...], total: X, creadas: Y, fallidas: Z }
        Siempre asigna tipo_agregacion="MASIVA" para cargas masivas
        """
        datos_csv = request.data.get('datos', [])
        
        if not datos_csv or not isinstance(datos_csv, list):
            return Response(
                {'error': 'Se requiere un array de datos en el campo "datos"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        usuario = request.user
        resultados = {
            'exitosas': [],
            'errores': [],
            'total': len(datos_csv),
            'creadas': 0,
            'fallidas': 0
        }
        
        for idx, fila in enumerate(datos_csv, start=1):
            try:
                # Obtener o crear Ejercicio
                nombre_ejercicio = fila.get('ejercicio', '').strip()
                if not nombre_ejercicio:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': 'El campo "ejercicio" es requerido'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                ejercicio, _ = Ejercicio.objects.get_or_create(
                    nombre_ejercicio=nombre_ejercicio,
                    defaults={'nombre_ejercicio': nombre_ejercicio}
                )
                
                # Obtener o crear Tipo Agregación "MASIVA" (siempre se usa MASIVA para cargas masivas)
                tipo_agregacion, _ = TipoAgregacion.objects.get_or_create(
                    nombre_agregacion='MASIVA',
                    defaults={'nombre_agregacion': 'MASIVA'}
                )
                
                # Obtener o crear Mercado
                nombre_mercado = fila.get('mercado', '').strip()
                if not nombre_mercado:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': 'El campo "mercado" es requerido'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                mercado, _ = Mercado.objects.get_or_create(
                    nombre_mercado=nombre_mercado,
                    defaults={'nombre_mercado': nombre_mercado}
                )
                
                # Obtener o crear Instrumento
                nombre_instrumento = fila.get('instrumento', '').strip()
                if not nombre_instrumento:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': 'El campo "instrumento" es requerido'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                instrumento, _ = Instrumento.objects.get_or_create(
                    nombre_instrumento=nombre_instrumento,
                    mercado=mercado,
                    defaults={
                        'nombre_instrumento': nombre_instrumento,
                        'mercado': mercado
                    }
                )
                
                # Validar y parsear fecha_pago
                fecha_pago_str = fila.get('fechaPago', '').strip()
                if not fecha_pago_str:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': 'El campo "fechaPago" es requerido'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                try:
                    # Intentar varios formatos de fecha
                    fecha_pago = None
                    formatos_fecha = ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d']
                    for formato in formatos_fecha:
                        try:
                            fecha_pago = datetime.strptime(fecha_pago_str, formato).date()
                            break
                        except ValueError:
                            continue
                    
                    if not fecha_pago:
                        raise ValueError(f'Formato de fecha no válido: {fecha_pago_str}')
                except Exception as e:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': f'Error al parsear fecha_pago: {str(e)}'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                # Validar y parsear año
                año_str = fila.get('año', '').strip() or fila.get('anio', '').strip()
                if not año_str:
                    # Intentar extraer del año de fecha_pago
                    año = fecha_pago.year
                else:
                    try:
                        año = int(año_str)
                    except ValueError:
                        resultados['errores'].append({
                            'fila': idx,
                            'error': f'El campo "año" debe ser un número: {año_str}'
                        })
                        resultados['fallidas'] += 1
                        continue
                
                # Validar y parsear secuencia_de_evento
                secuencia_str = fila.get('secuencia', '').strip()
                if not secuencia_str:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': 'El campo "secuencia" es requerido'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                try:
                    secuencia_de_evento = int(secuencia_str)
                except ValueError:
                    resultados['errores'].append({
                        'fila': idx,
                        'error': f'El campo "secuencia" debe ser un número: {secuencia_str}'
                    })
                    resultados['fallidas'] += 1
                    continue
                
                # Parsear valores numéricos opcionales
                dividendo = Decimal('0.00')
                if fila.get('dividendo'):
                    try:
                        dividendo = Decimal(str(fila.get('dividendo')))
                    except (InvalidOperation, ValueError):
                        dividendo = Decimal('0.00')
                
                valor_historico = Decimal('0.00')
                if fila.get('valor_historico') or fila.get('valorHistorico'):
                    try:
                        valor_historico = Decimal(str(fila.get('valor_historico') or fila.get('valorHistorico')))
                    except (InvalidOperation, ValueError):
                        valor_historico = Decimal('0.00')
                
                factor_actualizacion = 0.0
                if fila.get('factor_actualizacion') or fila.get('factorActualizacion'):
                    try:
                        factor_actualizacion = float(fila.get('factor_actualizacion') or fila.get('factorActualizacion'))
                    except (ValueError, TypeError):
                        factor_actualizacion = 0.0
                
                isfut = False
                if fila.get('isfut'):
                    isfut_str = str(fila.get('isfut')).lower().strip()
                    isfut = isfut_str in ['true', '1', 'si', 'sí', 'yes', 'verdadero']
                
                descripcion = fila.get('descripcion', '').strip() or ''
                
                # Extraer factores (factor8 a factor37)
                factores = []
                for i in range(8, 38):
                    factor_key = f'factor{i}'
                    factor_valor = fila.get(factor_key, '').strip()
                    if factor_valor:
                        try:
                            valor_factor = Decimal(str(factor_valor))
                            factores.append({
                                'numero_factor': f'Factor_{i}',
                                'valor': valor_factor
                            })
                        except (InvalidOperation, ValueError):
                            # Si no se puede parsear, usar 0
                            factores.append({
                                'numero_factor': f'Factor_{i}',
                                'valor': Decimal('0.0')
                            })
                    else:
                        # Si no está presente, usar 0
                        factores.append({
                            'numero_factor': f'Factor_{i}',
                            'valor': Decimal('0.0')
                        })
                
                # Crear la calificación
                with transaction.atomic():
                    calificacion_data = {
                        'tipo_agregacion': tipo_agregacion.id_tipo_agregacion,
                        'ejercicio': ejercicio.id_ejercicio,
                        'instrumento': instrumento.id_instrumento,
                        'secuencia_de_evento': secuencia_de_evento,
                        'dividendo': dividendo,
                        'valor_historico': valor_historico,
                        'fecha_pago': fecha_pago,
                        'año': año,
                        'descripcion': descripcion,
                        'isfut': isfut,
                        'factor_actualizacion': factor_actualizacion,
                        'factores': factores
                    }
                    
                    serializer = CalificacionSerializer(
                        data=calificacion_data,
                        context={'request': request}
                    )
                    
                    if serializer.is_valid():
                        calificacion = serializer.save()
                        resultados['exitosas'].append({
                            'fila': idx,
                            'id_calificacion': calificacion.id_calificacion,
                            'mensaje': 'Calificación creada exitosamente'
                        })
                        resultados['creadas'] += 1
                    else:
                        resultados['errores'].append({
                            'fila': idx,
                            'error': f'Error de validación: {serializer.errors}'
                        })
                        resultados['fallidas'] += 1
                        
            except Exception as e:
                resultados['errores'].append({
                    'fila': idx,
                    'error': f'Error inesperado: {str(e)}'
                })
                resultados['fallidas'] += 1
        
        # Determinar el código de estado HTTP
        if resultados['creadas'] == 0:
            http_status = status.HTTP_400_BAD_REQUEST
        elif resultados['fallidas'] > 0:
            # Usar 200 para respuestas parcialmente exitosas
            http_status = status.HTTP_200_OK
        else:
            http_status = status.HTTP_201_CREATED
        
        return Response(resultados, status=http_status)

@require_http_methods(["GET"])
@staff_member_required
def dashboard_stats(request):
    
    total_calificaciones = Calificacion.objects.count()
    total_usuarios = Usuario.objects.count()
    total_mercados = Mercado.objects.count()
    total_instrumentos = Instrumento.objects.count()
    
    calificaciones_por_mes = Calificacion.objects.annotate(
        month=TruncMonth('fecha_pago')
    ).values('month').annotate(
        count=Count('id_calificacion')
    ).order_by('month')[:12]
    
    calificaciones_por_tipo = Calificacion.objects.values(
        'tipo_agregacion__nombre_agregacion'
    ).annotate(
        count=Count('id_calificacion')
    )
    
    calificaciones_por_mercado = Calificacion.objects.values(
        'instrumento__mercado__nombre_mercado'
    ).annotate(
        count=Count('id_calificacion')
    )
    
    calificaciones_recientes = Calificacion.objects.select_related(
        'usuario', 'instrumento', 'tipo_agregacion'
    ).order_by('-fecha_pago')[:10]
    
    calificaciones_por_año = Calificacion.objects.values('año').annotate(
        count=Count('id_calificacion')
    ).order_by('año')
    
    usuarios_activos = Usuario.objects.filter(
        calificacion__isnull=False
    ).distinct().count()
    
    return JsonResponse({
        'totales': {
            'calificaciones': total_calificaciones,
            'usuarios': total_usuarios,
            'usuarios_activos': usuarios_activos,
            'mercados': total_mercados,
            'instrumentos': total_instrumentos,
        },
        'calificaciones_por_mes': [
            {
                'mes': item['month'].strftime('%Y-%m') if item['month'] else None,
                'count': item['count']
            }
            for item in calificaciones_por_mes
        ],
        'calificaciones_por_tipo': [
            {
                'tipo': item['tipo_agregacion__nombre_agregacion'],
                'count': item['count']
            }
            for item in calificaciones_por_tipo
        ],
        'calificaciones_por_mercado': [
            {
                'mercado': item['instrumento__mercado__nombre_mercado'],
                'count': item['count']
            }
            for item in calificaciones_por_mercado
        ],
        'calificaciones_por_año': [
            {
                'año': item['año'],
                'count': item['count']
            }
            for item in calificaciones_por_año
        ],
        'calificaciones_recientes': [
            {
                'id': cal.id_calificacion,
                'usuario': cal.usuario.username,
                'instrumento': cal.instrumento.nombre_instrumento,
                'tipo': cal.tipo_agregacion.nombre_agregacion,
                'fecha_pago': cal.fecha_pago.strftime('%Y-%m-%d'),
                'año': cal.año,
            }
            for cal in calificaciones_recientes
        ],
    })

class ReporteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para reportes de auditoría.
    Solo lectura, accesible únicamente para administradores.
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