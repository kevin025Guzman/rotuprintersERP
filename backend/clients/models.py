from django.db import models


class Client(models.Model):
    """Model for managing clients."""
    
    name = models.CharField(max_length=200, verbose_name='Nombre')
    company = models.CharField(max_length=200, blank=True, verbose_name='Empresa')
    phone = models.CharField(max_length=20, verbose_name='Teléfono')
    email = models.EmailField(blank=True, verbose_name='Correo Electrónico')
    address = models.TextField(blank=True, verbose_name='Dirección')
    rtn = models.CharField(max_length=20, blank=True, verbose_name='RTN')
    notes = models.TextField(blank=True, verbose_name='Notas')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
    
    def __str__(self):
        if self.company:
            return f"{self.name} - {self.company}"
        return self.name
    
    @property
    def total_sales(self):
        """Calculate total sales for this client."""
        return self.sales.filter(status='COMPLETED').aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
    
    @property
    def total_quotations(self):
        """Count total quotations for this client."""
        return self.quotations.count()
