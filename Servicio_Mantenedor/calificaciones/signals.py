from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.db import transaction
import threading
from django.conf import settings
from utils.kafka_client import KafkaProducerClient
from datetime import datetime
from .models import Calificacion

# Thread-local storage para almacenar el usuario actual
_thread_locals = threading.local()

def get_current_user():
    """Obtiene el usuario actual del thread-local storage"""
    return getattr(_thread_locals, 'user', None)

def set_current_user(user):
    """Establece el usuario actual en el thread-local storage"""
    _thread_locals.user = user

def enviar_evento_reporte(usuario, accion):
    """Helper para enviar evento a Kafka"""
    try:
        username = usuario.username if usuario else "Sistema"
        
        payload = {
            'usuario': username,
            'accion': accion,
            'fecha': datetime.now().isoformat(),
            'origen': 'mantenedor'
        }
        
        client = KafkaProducerClient()
        client.send_message(settings.KAFKA_TOPIC_REPORTES, payload)
    except Exception as e:
        print(f"Error al enviar evento Kafka: {e}")

@receiver(post_save, sender=Calificacion)
def registrar_accion_calificacion(sender, instance, created, **kwargs):
    """
    Emite evento Kafka cuando se crea o modifica una calificación.
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
        
        # Enviar evento async
        enviar_evento_reporte(usuario, accion)
            
    except Exception as e:
        # Log error but don't stop flow
        pass

@receiver(pre_delete, sender=Calificacion)
def registrar_eliminacion_calificacion(sender, instance, **kwargs):
    """
    Emite evento Kafka cuando se elimina una calificación.
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
    
    # Enviar evento async
    enviar_evento_reporte(usuario, accion)

