

from django.shortcuts import render


def dolgozok(request):
    return render(request, 'bonitadashboardapp/dolgozok.html')