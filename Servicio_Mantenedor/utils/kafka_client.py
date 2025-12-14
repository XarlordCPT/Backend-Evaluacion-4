import json
import logging
from django.conf import settings
from confluent_kafka import Producer

logger = logging.getLogger(__name__)

class KafkaProducerClient:
    """
    Cliente Singleton para producir mensajes a Kafka.

    Encapsula la lógica de inicialización y envío de mensajes
    usando confluent-kafka Producer.
    """
    _instance = None

    def __new__(cls):
        """Implementación del patrón Singleton."""
        if cls._instance is None:
            cls._instance = super(KafkaProducerClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Inicializa el Producer con la configuración de Django settings."""
        try:
            self.producer = Producer({
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'client.id': 'django-producer',
                'retries': 3,
            })
            logger.info("KafkaProducerClient inicializado correctamente.")
        except Exception as e:
            logger.error(f"Error al inicializar Kafka Producer: {e}")
            self.producer = None

    def _delivery_report(self, err, msg):
        """
        Callback llamado tras confirmar la entrega (o falla) del mensaje.
        
        Args:
            err (KafkaError): Error si ocurrió alguno, None si fue exitoso.
            msg (Message): Objeto mensaje enviado.
        """
        if err is not None:
            logger.error(f'Error al enviar mensaje a Kafka: {err}')
        else:
            logger.info(f'Mensaje enviado a {msg.topic()} [{msg.partition()}]')

    def send_message(self, topic, data):
        """
        Envía un diccionario `data` como JSON al `topic`.

        Args:
            topic (str): Nombre del tópico de Kafka.
            data (dict): Datos a enviar (serán serializados a JSON).

        Raises:
            Exception: Si hay error en serialización o envío.
        """
        if not self.producer:
            logger.error("Producer no inicializado. No se puede enviar mensaje.")
            return

        try:
            # Serializar a JSON
            message_value = json.dumps(data).encode('utf-8')
            
            # Produce asíncrono
            self.producer.produce(
                topic, 
                value=message_value, 
                callback=self._delivery_report
            )
            
            # Forzar el envío inmediato (flush) para asegurar entrega en este ejemplo
            # En producción de alto volumen, se puede confiar en el background thread
            self.producer.flush(timeout=1.0)
            
        except Exception as e:
            logger.error(f"Excepción en KafkaProducerClient: {e}")
            
        except Exception as e:
            logger.error(f"Excepción en KafkaProducerClient: {e}")
