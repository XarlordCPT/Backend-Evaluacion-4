from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.db import transaction
import threading
from .models import Calificacion, Reporte

# Thread-local storage para almacenar el usuario actual
_thread_locals = threading.local()

def get_current_user():
    """Obtiene el usuario actual del thread-local storage"""
    return getattr(_thread_locals, 'user', None)

def set_current_user(user):
    """Establece el usuario actual en el thread-local storage"""
    _thread_locals.user = user

@receiver(post_save, sender=Calificacion)
def registrar_accion_calificacion(sender, instance, created, **kwargs):
    """
    Registra en Reporte cuando se crea o modifica una calificación.
    """
    usuario = get_current_user()
    
    try:
        # Obtener información de las relaciones de forma segura
        instrumento_nombre = "N/A"
        ejercicio_nombre = "N/A"
        
        try:
            if hasattr(instance, 'instrumento') and instance.instrumento:
                instrumento_nombre = instance.instrumento.nombre_instrumento
        except:
            pass
        
        try:
            if hasattr(instance, 'ejercicio') and instance.ejercicio:
                ejercicio_nombre = instance.ejercicio.nombre_ejercicio
        except:
            pass
        
        if created:
            accion = f"Calificación creada: ID {instance.id_calificacion} - Instrumento: {instrumento_nombre}, Ejercicio: {ejercicio_nombre}"
        else:
            accion = f"Calificación modificada: ID {instance.id_calificacion} - Instrumento: {instrumento_nombre}, Ejercicio: {ejercicio_nombre}"
        
        # Crear el reporte en una transacción separada para evitar problemas
        with transaction.atomic():
            Reporte.objects.create(
                usuario=usuario,
                accion=accion
            )
    except Exception as e:
        # Si hay un error al crear el reporte, no queremos que falle la operación principal
        # Solo logueamos el error (en producción usarías logging)
        pass

@receiver(pre_delete, sender=Calificacion)
def registrar_eliminacion_calificacion(sender, instance, **kwargs):
    """
    Registra en Reporte cuando se elimina una calificación.
    """
    usuario = get_current_user()
    
    # Obtener información antes de eliminar
    try:
        instrumento_nombre = "N/A"
        ejercicio_nombre = "N/A"
        
        try:
            if hasattr(instance, 'instrumento') and instance.instrumento:
                instrumento_nombre = instance.instrumento.nombre_instrumento
        except:
            pass
        
        try:
            if hasattr(instance, 'ejercicio') and instance.ejercicio:
                ejercicio_nombre = instance.ejercicio.nombre_ejercicio
        except:
            pass
        
        accion = f"Calificación eliminada: ID {instance.id_calificacion} - Instrumento: {instrumento_nombre}, Ejercicio: {ejercicio_nombre}"
    except:
        accion = f"Calificación eliminada: ID {instance.id_calificacion}"
    
    # Crear el reporte
    try:
        with transaction.atomic():
            Reporte.objects.create(
                usuario=usuario,
                accion=accion
            )
    except Exception as e:
        # Si hay un error al crear el reporte, no queremos que falle la operación principal
        pass

