from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Quotation(models.Model):
    """Model for quotations/estimates."""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        APPROVED = 'APPROVED', 'Aprobada'
        REJECTED = 'REJECTED', 'Rechazada'
        CONVERTED = 'CONVERTED', 'Convertida a Venta'
    
    quotation_number = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name='Número de Cotización'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='quotations',
        verbose_name='Cliente'
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='quotations',
        verbose_name='Creado Por'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Subtotal'
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Descuento (%)'
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Monto Descuento'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Total'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    valid_until = models.DateField(null=True, blank=True, verbose_name='Válida Hasta')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quotations'
        ordering = ['-created_at']
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
    
    def __str__(self):
        return f"{self.quotation_number} - {self.client.name}"
    
    def calculate_totals(self):
        """Calculate subtotal and total from items."""
        self.subtotal = sum(item.total for item in self.items.all())
        self.discount_amount = self.subtotal * (self.discount_percentage / Decimal('100'))
        self.total_amount = self.subtotal - self.discount_amount
        self.save()
    
    def save(self, *args, **kwargs):
        if not self.quotation_number:
            # Auto-generate quotation number
            last_quotation = Quotation.objects.order_by('-id').first()
            if last_quotation and last_quotation.quotation_number.startswith('COT-'):
                try:
                    last_number = int(last_quotation.quotation_number.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            self.quotation_number = f"COT-{new_number:06d}"
        super().save(*args, **kwargs)


class QuotationItem(models.Model):
    """Items within a quotation."""
    
    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Cotización'
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
    description = models.TextField(verbose_name='Descripción')
    width_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Ancho (pulgadas)'
    )
    height_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Alto (pulgadas)'
    )
    square_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Pulgadas Cuadradas'
    )
    price_per_square_inch = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Precio por Pulgada Cuadrada'
    )
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Total'
    )
    
    class Meta:
        db_table = 'quotation_items'
        verbose_name = 'Item de Cotización'
        verbose_name_plural = 'Items de Cotización'
    
    def __str__(self):
        return f"{self.quotation.quotation_number} - {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Calculate square inches and total
        self.square_inches = self.width_inches * self.height_inches
        self.total = self.square_inches * self.price_per_square_inch * self.quantity
        super().save(*args, **kwargs)
        # Update quotation totals
        self.quotation.calculate_totals()
