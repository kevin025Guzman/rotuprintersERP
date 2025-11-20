import os

import django


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rotuprinters.settings")
django.setup()

from django.contrib.auth import get_user_model


User = get_user_model()

username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123")

user, created = User.objects.get_or_create(
    username=username,
    defaults={"email": email}
)

if created:
    print("Creating initial admin user...")

if password:
    user.set_password(password)

user.email = email
user_role_enum = getattr(User, "Role", None)
if user_role_enum and hasattr(user_role_enum, "ADMIN"):
    user.role = user_role_enum.ADMIN
else:
    user.role = "ADMIN"
user.is_staff = True
user.is_superuser = True
user.is_active = True
user.save()

print(f"Admin user '{user.username}' ensured with role ADMIN.")
