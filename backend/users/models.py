from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model with role-based access control.
    """
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        SELLER = 'SELLER', 'Operaciones'
        DESIGNER = 'DESIGNER', 'Vendedor'
    
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SELLER,
    )
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_seller(self):
        return self.is_operations
    
    @property
    def is_designer(self):
        return self.is_vendor

    @property
    def is_operations(self):
        """Former 'seller' role, now named Operaciones."""
        return self.role == self.Role.SELLER

    @property
    def is_vendor(self):
        """Former 'designer' role, now named Vendedor."""
        return self.role == self.Role.DESIGNER
