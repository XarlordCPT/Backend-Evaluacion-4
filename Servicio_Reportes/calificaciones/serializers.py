from rest_framework import serializers
from .models import Reporte, Usuario

class ReporteSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Reporte
        fields = ['id_reporte', 'usuario', 'accion', 'fecha']
        read_only_fields = ['id_reporte', 'usuario', 'fecha']