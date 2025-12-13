from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, Empleado

# Para que el modelo Usuario personalizado funcione bien en el admin
class CustomUserAdmin(UserAdmin):
    model = Usuario
    
    # Campos que se mostrarán en la lista de usuarios
    # Añadimos 'rol' para verlo de un vistazo
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'rol']
    
    # --- Esta es la parte clave ---
    # Añadimos 'rol' y 'empleado' a los "fieldsets" para poder editarlos
    # (Copiamos los fieldsets por defecto de UserAdmin y añadimos los nuestros)
    
    # Campos al EDITAR un usuario
    fieldsets = UserAdmin.fieldsets + (
        ('Campos Personalizados', {
            'fields': ('rol', 'empleado')
        }),
    )
    
    # Campos al CREAR un usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Campos Personalizados', {
            'fields': ('rol', 'empleado', 'first_name', 'last_name', 'email')
        }),
    )

# Registramos los modelos para que aparezcan en el admin
admin.site.register(Usuario, CustomUserAdmin)
admin.site.register(Rol)
admin.site.register(Empleado)