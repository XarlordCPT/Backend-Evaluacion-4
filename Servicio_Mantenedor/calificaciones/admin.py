from django.contrib import admin
from .models import (
    Mercado, TipoAgregacion, Ejercicio, Instrumento, 
    Calificacion, Factor
)

# Registramos todos los modelos de esta app
admin.site.register(Mercado)
admin.site.register(TipoAgregacion)
admin.site.register(Ejercicio)
admin.site.register(Instrumento)
admin.site.register(Calificacion)
admin.site.register(Factor)