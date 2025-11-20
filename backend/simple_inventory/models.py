from django.db import models


class SimpleProduct(models.Model):
    """Producto básico cuyo inventario se controla manualmente."""

    name = models.CharField(max_length=150, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    sku = models.CharField(max_length=50, unique=True, blank=True, verbose_name='SKU')
    quantity = models.PositiveIntegerField(default=0, verbose_name='Cantidad')
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='simple_products',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'simple_inventory_products'
        ordering = ['name']
        verbose_name = 'Producto de Inventario'
        verbose_name_plural = 'Productos de Inventario'

    def __str__(self) -> str:  # pragma: no cover - representación simple
        return f"{self.name} ({self.sku or 'Sin SKU'})"

    def save(self, *args, **kwargs):
        if not self.sku:
            import uuid
            self.sku = f"INV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    """Movimientos que afectan el stock manual de los productos simples."""

    class MovementType(models.TextChoices):
        ENTRY = 'ENTRY', 'Entrada'
        EXIT = 'EXIT', 'Salida'

    product = models.ForeignKey(
        SimpleProduct,
        on_delete=models.CASCADE,
        related_name='movements',
        verbose_name='Producto'
    )
    movement_type = models.CharField(
        max_length=10,
        choices=MovementType.choices,
        verbose_name='Tipo de Movimiento'
    )
    quantity = models.PositiveIntegerField(verbose_name='Cantidad')
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='simple_inventory_movements',
        verbose_name='Registrado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simple_inventory_movements'
        ordering = ['-created_at']
        verbose_name = 'Movimiento de Stock'
        verbose_name_plural = 'Movimientos de Stock'

    def __str__(self) -> str:  # pragma: no cover - representación simple
        return f"{self.get_movement_type_display()} - {self.product.name} ({self.quantity})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            if self.movement_type == self.MovementType.ENTRY:
                self.product.quantity += self.quantity
            else:
                self.product.quantity = max(0, self.product.quantity - self.quantity)
            self.product.save(update_fields=['quantity', 'updated_at'])
