from django.contrib import admin
from django.urls import path, include
from calificaciones import views as calificaciones_views

urlpatterns = [
    path('admin/dashboard-stats/', calificaciones_views.dashboard_stats, name='dashboard_stats'),
    path('admin/', admin.site.urls),
    
    path('api/calificaciones/', include('calificaciones.urls')),
]