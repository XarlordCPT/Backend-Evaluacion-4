from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'core_rol'

    def __str__(self):
        return self.nombre_rol

class Usuario(AbstractUser):
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    class Meta:
        managed = False
        db_table = 'core_usuario'

    def __str__(self):
        return self.username

class Reporte(models.Model):
    id_reporte = models.AutoField(primary_key=True)
    # Cambiamos a models.SET_NULL para que si se borra el usuario, el reporte quede (integridad referencial)
    # Pero ahora Usuario es un modelo local (o abstract/proxy) que apunta a la misma tabla?
    # En microservicios puros, esto sería solo un ID o username.
    # Dado que estamos compartiendo DB o tablas 'core_', mantenemos la FK.
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    accion = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        fecha_hora = self.fecha.strftime('%Y-%m-%d %H:%M')
        usuario = self.usuario.username if self.usuario else "Sistema"
        return f"[{fecha_hora}] ({usuario}) - {self.accion[:40]}..."