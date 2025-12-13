from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username

        if user.rol:
            token['rol'] = user.rol.nombre_rol
        else:
            token['rol'] = None

        if hasattr(user, 'empleado') and user.empleado:
            token['rut'] = user.empleado.rut
        else:
            token['rut'] = None

        return token
    