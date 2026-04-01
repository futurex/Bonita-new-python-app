from django.urls import path, include


from .import views, jelenleti, dolgozok, bevetelek, dashboard

urlpatterns = [
    path('', views.index, name='index'),
    path('jelenleti/', jelenleti.jelenleti, name='jelenleti'),
    path('jelenleti/exprotot/', jelenleti.exprotot, name='jelenleti_exprotot'),
    path('dolgozok/', dolgozok.dolgozok, name='dolgozok'),
    path('bevetelek/', bevetelek.bevetelek, name='bevetelek'),
    path('dashboard/', dashboard.dashboard, name='dashboard'),
    path('mentes/', jelenleti.adat_mentese, name='adat_mentese'),
    
]