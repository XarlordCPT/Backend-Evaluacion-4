import json
import logging
from django.conf import settings
from confluent_kafka import Producer

logger = logging.getLogger(__name__)

class KafkaProducerClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KafkaProducerClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.producer = Producer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'django-login-producer',
            'retries': 3,
        })

    def _delivery_report(self, err, msg):
        """Callback llamado tras confirmar la entrega (o falla) del mensaje."""
        if err is not None:
            logger.error(f'Error al enviar mensaje a Kafka: {err}')
        else:
            logger.info(f'Mensaje enviado a {msg.topic()} [{msg.partition()}]')

    def send_message(self, topic, data):
        """
        Envía un diccionario `data` como JSON al `topic`.
        """
        try:
            # Serializar a JSON
            message_value = json.dumps(data).encode('utf-8')
            
            # Produce asíncrono
            self.producer.produce(
                topic, 
                value=message_value, 
                callback=self._delivery_report
            )
            
            # Forzar el envío inmediato (flush)
            self.producer.flush(timeout=1.0)
            
        except Exception as e:
            logger.error(f"Excepción en KafkaProducerClient: {e}")
