from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Usuario

@receiver(post_save, sender=Usuario)
def actualizar_is_staff_por_rol(sender, instance, **kwargs):
    """
    Señal que automáticamente establece is_staff=True cuando un usuario tiene el rol "Administrador"
    y is_staff=False cuando no lo tiene.
    """
    if instance.rol:
        # Verificar si el rol es "Administrador" (case-insensitive)
        if instance.rol.nombre_rol.lower() == "administrador":
            if not instance.is_staff:
                # Actualizar solo si cambió para evitar loops infinitos
                Usuario.objects.filter(pk=instance.pk).update(is_staff=True)
                instance.is_staff = True
        else:
            # Si no es administrador, quitar is_staff (opcional, puedes comentar esto si quieres mantener is_staff manual)
            # Usuario.objects.filter(pk=instance.pk).update(is_staff=False)
            # instance.is_staff = False
            pass
    else:
        # Si no tiene rol, mantener is_staff como está (no cambiar)
        pass

