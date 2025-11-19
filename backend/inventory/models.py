from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class ProductCategory(models.Model):
    """Categories for inventory products."""
    
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_categories'
        ordering = ['name']
        verbose_name = 'Categoría de Producto'
        verbose_name_plural = 'Categorías de Productos'
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Model for inventory products."""
    
    class UnitMeasure(models.TextChoices):
        ROLL = 'ROLL', 'Rollo'
        SHEET = 'SHEET', 'Lámina'
        UNIT = 'UNIT', 'Unidad'
        METER = 'METER', 'Metro'
        SQUARE_METER = 'SQM', 'Metro Cuadrado'
        SQUARE_INCH = 'SQIN', 'Pulgada Cuadrada'
    
    name = models.CharField(max_length=200, verbose_name='Nombre')
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.PROTECT, 
        related_name='products',
        verbose_name='Categoría'
    )
    description = models.TextField(blank=True, verbose_name='Descripción')
    sku = models.CharField(max_length=50, unique=True, blank=True, verbose_name='SKU')
    unit_measure = models.CharField(
        max_length=10,
        choices=UnitMeasure.choices,
        default=UnitMeasure.UNIT,
        verbose_name='Unidad de Medida'
    )
    quantity_available = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Cantidad Disponible'
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Costo Unitario'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Precio Unitario'
    )
    price_per_square_inch = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Precio por Pulgada Cuadrada',
        help_text='Para cálculo de cotizaciones'
    )
    supplier = models.CharField(max_length=200, blank=True, verbose_name='Proveedor')
    minimum_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Stock Mínimo'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['name']
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
    
    def __str__(self):
        return f"{self.name} ({self.get_unit_measure_display()})"
    
    @property
    def is_low_stock(self):
        """Check if product is below minimum stock level."""
        return self.quantity_available <= self.minimum_stock
    
    @property
    def stock_status(self):
        """Return stock status."""
        if self.quantity_available == 0:
            return 'SIN_STOCK'
        elif self.is_low_stock:
            return 'STOCK_BAJO'
        return 'DISPONIBLE'
    
    def save(self, *args, **kwargs):
        if not self.sku:
            # Auto-generate SKU if not provided
            import uuid
            self.sku = f"PRD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    """Track inventory movements."""
    
    class MovementType(models.TextChoices):
        ENTRY = 'ENTRY', 'Entrada'
        EXIT = 'EXIT', 'Salida'
        ADJUSTMENT = 'ADJUSTMENT', 'Ajuste'
    
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='movements',
        verbose_name='Producto'
    )
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        verbose_name='Tipo de Movimiento'
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad'
    )
    reference = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name='Referencia',
        help_text='Número de venta, compra, etc.'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Creado Por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
    
    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name} ({self.quantity})"
    
    def save(self, *args, **kwargs):
        """Update product quantity on save."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            if self.movement_type == self.MovementType.ENTRY:
                self.product.quantity_available += self.quantity
            elif self.movement_type == self.MovementType.EXIT:
                self.product.quantity_available -= self.quantity
            elif self.movement_type == self.MovementType.ADJUSTMENT:
                self.product.quantity_available = self.quantity
            
            self.product.save()
