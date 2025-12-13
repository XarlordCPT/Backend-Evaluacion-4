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
    # Empleado relationship omitted as it didn't appear to be used in views

    class Meta:
        managed = False
        db_table = 'core_usuario'

    def __str__(self):
        return self.username

class Mercado(models.Model):
    id_mercado = models.AutoField(primary_key=True)
    nombre_mercado = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre_mercado

#......................................................

class TipoAgregacion(models.Model):
    id_tipo_agregacion = models.AutoField(primary_key=True)
    nombre_agregacion = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre_agregacion
  
#......................................................  

class Ejercicio(models.Model):
    id_ejercicio = models.AutoField(primary_key=True)
    nombre_ejercicio = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre_ejercicio

#...................................................... 

class Instrumento(models.Model):
    id_instrumento = models.AutoField(primary_key=True)
    nombre_instrumento = models.CharField(max_length=100)
    mercado = models.ForeignKey(
        Mercado,
        on_delete=models.PROTECT
    )
    
    def __str__(self):
        return f"{self.nombre_instrumento} ({self.mercado.nombre_mercado})"
    
#......................................................    

class Calificacion(models.Model):
    id_calificacion = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE
    )
    tipo_agregacion = models.ForeignKey(
        TipoAgregacion,
        on_delete=models.PROTECT
    )
    ejercicio = models.ForeignKey(
        Ejercicio,
        on_delete=models.PROTECT
    )
    instrumento = models.ForeignKey(
        Instrumento,
        on_delete=models.PROTECT
    )
    secuencia_de_evento = models.IntegerField()
    dividendo = models.DecimalField(max_digits=10, decimal_places=2)
    valor_historico = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    año = models.IntegerField()
    descripcion = models.TextField()
    isfut = models.BooleanField(default=False)
    factor_actualizacion = models.FloatField()

    def __str__(self):
        return f"Calificación {self.id_calificacion} - {self.instrumento}"
    
#......................................................

class Factor(models.Model):
    FACTOR_CHOICES = [
        (f"Factor_{i}", f"Factor {i}") for i in range(8,38)
    ]

    id_factor = models.AutoField(primary_key=True)
    calificacion = models.ForeignKey(
        Calificacion,
        on_delete=models.CASCADE,
        related_name='factores'
    )
    numero_factor = models.CharField(
        max_length=20,
        choices=FACTOR_CHOICES
    )
    valor = models.DecimalField(max_digits=20, decimal_places=8)

    def __str__(self):
        return f"{self.numero_factor} de Calificación {self.calificacion.id_calificacion}"
    
    class Meta:
        unique_together = ('calificacion', 'numero_factor')

#......................................................

class Reporte(models.Model):
    id_reporte = models.AutoField(primary_key=True)
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