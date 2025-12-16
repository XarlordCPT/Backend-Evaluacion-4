from rest_framework import serializers
from .models import (Calificacion, Factor, Instrumento, Mercado, TipoAgregacion, Ejercicio)
from django.db import transaction
from .signals import set_current_user

class MercadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mercado
        fields = '__all__'

class TipoAgregacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAgregacion
        fields = '__all__'

class EjercicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ejercicio
        fields = '__all__'

class InstrumentoSerializer(serializers.ModelSerializer):
    mercado_nombre = serializers.StringRelatedField(source='mercado', read_only=True)
    mercado = serializers.PrimaryKeyRelatedField(queryset=Mercado.objects.all())
    
    class Meta:
        model = Instrumento
        fields = ['id_instrumento', 'nombre_instrumento', 'mercado', 'mercado_nombre']
        
    def to_representation(self, instance):
        """Personalizar la representación para mantener compatibilidad"""
        representation = super().to_representation(instance)
        # Mantener 'mercado' como nombre para compatibilidad con el frontend existente
        # pero solo si mercado_nombre existe (para lectura)
        if 'mercado_nombre' in representation:
            representation['mercado'] = representation.pop('mercado_nombre')
        return representation

class FactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factor
        fields = ['numero_factor', 'valor']

class CalificacionSerializer(serializers.ModelSerializer):
    factores = FactorSerializer(many=True)

    # Campos de solo lectura: Frontend los recibe al hacer GET
    # Se usan en NUAM/src/pages/Mantenedor.jsx para mostrar datos en la tabla
    usuario = serializers.StringRelatedField(read_only=True)
    tipo_agregacion_info = serializers.StringRelatedField(source='tipo_agregacion', read_only=True)
    ejercicio_info = serializers.StringRelatedField(source='ejercicio', read_only=True)
    instrumento_info = InstrumentoSerializer(source='instrumento', read_only=True) 

    # Campos de escritura: Frontend envía IDs al hacer POST/PUT
    # Frontend envía estos campos cuando crea/modifica calificaciones
    tipo_agregacion = serializers.PrimaryKeyRelatedField(queryset=TipoAgregacion.objects.all(), write_only=True) 
    ejercicio = serializers.PrimaryKeyRelatedField(queryset=Ejercicio.objects.all(), write_only=True)
    instrumento = serializers.PrimaryKeyRelatedField(queryset=Instrumento.objects.all(), write_only=True)
    
    class Meta:
        model = Calificacion
        fields = [
            'id_calificacion',
            'usuario',
            'tipo_agregacion',
            'tipo_agregacion_info',
            'ejercicio',
            'ejercicio_info',
            'instrumento',
            'instrumento_info',
            'secuencia_de_evento',
            'dividendo',
            'valor_historico',
            'fecha_pago',
            'año',
            'descripcion',
            'isfut',
            'factor_actualizacion',
            'factores'
        ]
    
    def create(self, validated_data):
        factores_datos = validated_data.pop('factores', [])
        usuario = self.context['request'].user
        # Establecer usuario en thread-local para las señales
        set_current_user(usuario)
        try:
            with transaction.atomic():
                calificacion = Calificacion.objects.create(usuario=usuario, **validated_data)
                for factor_datos in factores_datos:
                    Factor.objects.create(calificacion=calificacion, **factor_datos)
            return calificacion
        finally:
            # Limpiar el usuario del thread-local
            set_current_user(None)
    
    def update(self, instance, validated_data):
        factores_datos = validated_data.pop('factores', [])
        usuario = self.context['request'].user
        # Establecer usuario en thread-local para las señales
        set_current_user(usuario)
        try:
            # Actualizar campos de la calificación
            instance.tipo_agregacion = validated_data.get('tipo_agregacion', instance.tipo_agregacion)
            instance.ejercicio = validated_data.get('ejercicio', instance.ejercicio)
            instance.instrumento = validated_data.get('instrumento', instance.instrumento)
            instance.secuencia_de_evento = validated_data.get('secuencia_de_evento', instance.secuencia_de_evento)
            instance.dividendo = validated_data.get('dividendo', instance.dividendo)
            instance.valor_historico = validated_data.get('valor_historico', instance.valor_historico)
            instance.fecha_pago = validated_data.get('fecha_pago', instance.fecha_pago)
            instance.año = validated_data.get('año', instance.año)
            instance.descripcion = validated_data.get('descripcion', instance.descripcion)
            instance.isfut = validated_data.get('isfut', instance.isfut)
            instance.factor_actualizacion = validated_data.get('factor_actualizacion', instance.factor_actualizacion)

            with transaction.atomic():
                instance.save()
                # Eliminar factores existentes y crear los nuevos
                instance.factores.all().delete()
                for factor_dato in factores_datos:
                    Factor.objects.create(calificacion=instance, **factor_dato)
            return instance
        finally:
            # Limpiar el usuario del thread-local
            set_current_user(None)