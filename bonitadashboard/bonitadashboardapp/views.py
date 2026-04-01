from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login

def index(request):
    if request.method == 'POST':
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

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