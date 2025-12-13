#Importes
from django.db import models
from django.contrib.auth.models import AbstractUser

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre_rol

class Empleado(models.Model):
    id_empleado = models.AutoField(primary_key=True)
    rut = models.CharField(max_length=10, unique=True)

    def __str__(self):
        if hasattr(self, 'usuario'):
            return f"Empleado {self.rut} ({self.usuario.username})"
        return f"Empleado {self.rut}"
    
class Usuario(AbstractUser):
    empleado = models.OneToOneField(
        Empleado,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    def __str__(self):
        return self.username