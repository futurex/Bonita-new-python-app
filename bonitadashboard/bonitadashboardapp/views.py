from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login
from django.db.utils import OperationalError, ProgrammingError

def index(request):
    if request.method == 'POST':
        username = request.POST["username"]
        password = request.POST["password"]
        try:
            user = authenticate(request, username=username, password=password)
        except (OperationalError, ProgrammingError) as exc:
            if "auth_user" in str(exc):
                return render(request, "bonitadashboardapp/index.html", {
                    "error": "Az adatbazis inicializalasa hianyzik. Futtasd: python manage.py migrate"
                })
            raise

        if user is not None:
            print("User is valid!")
            login(request, user)
            return render(request, 'bonitadashboardapp/dashboard.html') 
        else:
            print("Invalid username or password.")
            return render(request, "bonitadashboardapp/index.html", {
                "error": "Hibás felhasználónév vagy jelszó"
            })

    return render(request, 'bonitadashboardapp/index.html') 