from django.contrib import admin
from django.urls import path, include
from core import views as core_views

urlpatterns = [
    path('admin/dashboard-stats/', core_views.dashboard_stats, name='dashboard_stats'),
    path('admin/', admin.site.urls),
    
    path('api/auth/', include('core.urls')),
]