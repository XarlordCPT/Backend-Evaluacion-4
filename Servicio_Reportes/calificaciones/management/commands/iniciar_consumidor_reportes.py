import json
import logging
import signal
import sys
from django.core.management.base import BaseCommand
from django.conf import settings
from confluent_kafka import Consumer, KafkaError
from confluent_kafka.admin import AdminClient, NewTopic
from calificaciones.models import Reporte, Usuario
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Inicia el consumidor de Kafka para Reportes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando consumidor de Kafka para Reportes...'))

        kafka_config = {'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS}
        topic_name = settings.KAFKA_TOPIC_REPORTES

        # 1. Asegurar que el tópico existe
        try:
            admin_client = AdminClient(kafka_config)
            # Revisar metadatos para ver si existen tópicos
            cluster_metadata = admin_client.list_topics(timeout=10)
            if topic_name not in cluster_metadata.topics:
                self.stdout.write(self.style.WARNING(f"Tópico '{topic_name}' no encontrado. Creándolo..."))
                new_topics = [NewTopic(topic_name, num_partitions=1, replication_factor=1)]
                futures = admin_client.create_topics(new_topics)
                
                # Esperar a que se cree
                for topic, future in futures.items():
                    try:
                        future.result()  # Bloquea hasta obtener resultado
                        self.stdout.write(self.style.SUCCESS(f"Tópico '{topic}' creado exitosamente."))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Falló la creación del tópico '{topic}': {e}"))
            else:
                 self.stdout.write(self.style.SUCCESS(f"Tópico '{topic_name}' encontrado."))

        except Exception as e:
             self.stdout.write(self.style.ERROR(f"Error verificando/creando tópico: {e}"))
             # No fallamos fatalmente, intentamos consumir igual por si acaso era error de conexión admin

        consumer_conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'grupo-servicio-reportes',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        }

        consumer = Consumer(consumer_conf)
        consumer.subscribe([topic_name])

        # Manejo de señal para salir limpiamente
        def signal_handler(sig, frame):
            self.stdout.write(self.style.WARNING('\nCerrando consumidor...'))
            consumer.close()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        try:
            while True:
                msg = consumer.poll(1.0)

                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Error en consumidor: {msg.error()}")
                        continue

                try:
                    # Decodificar mensaje
                    data_str = msg.value().decode('utf-8')
                    data = json.loads(data_str)
                    
                    self.stdout.write(f"Procesando evento: {data}")

                    # Extraer datos
                    username = data.get('usuario')
                    accion = data.get('accion')
                    # fecha_str = data.get('fecha') # Podríamos usar la fecha del evento, pero auto_now_add usa la actual

                    # Buscar usuario
                    usuario = None
                    if username and username != "Sistema":
                        try:
                            usuario = Usuario.objects.get(username=username)
                        except Usuario.DoesNotExist:
                            logger.warning(f"Usuario {username} no encontrado. Asignando a null.")

                    # Crear reporte
                    Reporte.objects.create(
                        usuario=usuario,
                        accion=accion
                    )
                    
                    # Confirmar procesamiento
                    consumer.commit(asynchronous=False)
                    self.stdout.write(self.style.SUCCESS(f"Reporte guardado: {accion[:30]}..."))

                except Exception as e:
                    logger.error(f"Error procesando mensaje: {e}")
                    # En producción: Manejar Dead Letter Queue (DLQ)

        except KeyboardInterrupt:
            pass
        finally:
            consumer.close()
