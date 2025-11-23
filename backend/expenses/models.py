from django.conf import settings
from django.db import models


class Expense(models.Model):
    """Operational expense entry."""

    description = models.TextField()
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='expenses',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description[:50]} - L {self.amount}"
