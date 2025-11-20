import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rotuprinters.settings")
django.setup()

from users.models import User  # tu modelo personalizado

username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123")

if not User.objects.filter(username=username).exists():
    print("Creating initial admin user...")
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print("Admin user created.")
else:
    print("Admin user already exists.")
