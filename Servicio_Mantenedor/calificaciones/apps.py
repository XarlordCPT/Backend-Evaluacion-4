from django.apps import AppConfig


class CalificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'calificaciones'
    
    def ready(self):
        # Importar las señales para que se registren
        import calificaciones.signals