from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from decimal import Decimal


class Sale(models.Model):
    """Model for sales/invoices."""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        COMPLETED = 'COMPLETED', 'Completada'
        CANCELLED = 'CANCELLED', 'Cancelada'
    
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Efectivo'
        TRANSFER = 'TRANSFER', 'Transferencia'
    
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Número de Factura'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='sales',
        verbose_name='Cliente'
    )
    quotation = models.ForeignKey(
        'quotations.Quotation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
        verbose_name='Cotización'
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales',
        verbose_name='Ventas'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name='Método de Pago'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Subtotal'
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=settings.ISV_TAX_RATE * 100,  # 15%
        verbose_name='Tasa de Impuesto (%)'
    )
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Impuesto (ISV)'
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Completado')
    
    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
    
    def __str__(self):
        return f"{self.invoice_number} - {self.client.name}"
    
    def calculate_totals(self):
        """Calculate subtotal, tax and total from items."""
        self.subtotal = sum(item.total for item in self.items.all())
        self.discount_amount = self.subtotal * (self.discount_percentage / Decimal('100'))
        subtotal_after_discount = self.subtotal - self.discount_amount
        self.tax_amount = subtotal_after_discount * (self.tax_rate / Decimal('100'))
        self.total_amount = subtotal_after_discount + self.tax_amount
        self.save()
    
    def complete_sale(self):
        """Complete the sale and update inventory."""
        from django.utils import timezone
        from inventory.models import StockMovement
        
        if self.status == self.Status.COMPLETED:
            return
        
        # Update inventory for each item
        for item in self.items.all():
            # Create stock movement
            StockMovement.objects.create(
                product=item.product,
                movement_type=StockMovement.MovementType.EXIT,
                quantity=item.quantity_used,
                reference=self.invoice_number,
                notes=f'Venta - {item.description}',
                created_by=self.created_by
            )
        
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()
        
        # Update quotation status if exists
        if self.quotation:
            self.quotation.status = 'CONVERTED'
            self.quotation.save()
    
    def save(self, *args, **kwargs):
        from django.utils import timezone

        if not self.invoice_number:
            # Auto-generate invoice number
            last_sale = Sale.objects.order_by('-id').first()
            if last_sale and last_sale.invoice_number.startswith('FAC-'):
                try:
                    last_number = int(last_sale.invoice_number.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            self.invoice_number = f"FAC-{new_number:06d}"

        if self.completed_at and timezone.is_naive(self.completed_at):
            self.completed_at = timezone.make_aware(self.completed_at, timezone.get_current_timezone())
        super().save(*args, **kwargs)


class SaleItem(models.Model):
    """Items within a sale."""
    
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Venta'
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
    description = models.TextField(blank=True, default='', verbose_name='Descripción')
    width_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Ancho (pulgadas)'
    )
    height_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Alto (pulgadas)'
    )
    square_inches = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Pulgadas Cuadradas'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Precio Unitario'
    )
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    quantity_used = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Cantidad Usada del Inventario'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Total'
    )
    
    class Meta:
        db_table = 'sale_items'
        verbose_name = 'Item de Venta'
        verbose_name_plural = 'Items de Venta'
    
    def __str__(self):
        return f"{self.sale.invoice_number} - {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Calculate square inches and total
        if self.width_inches and self.height_inches:
            self.square_inches = self.width_inches * self.height_inches
        self.total = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        # Update sale totals
        self.sale.calculate_totals()
