from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quotations", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="quotation",
            name="apply_tax",
            field=models.BooleanField(default=False, verbose_name="Aplicar ISV"),
        ),
        migrations.AddField(
            model_name="quotation",
            name="tax_rate",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("15.00"),
                max_digits=5,
                verbose_name="Tasa de Impuesto (%)",
            ),
        ),
        migrations.AddField(
            model_name="quotation",
            name="tax_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                verbose_name="Monto Impuesto",
            ),
        ),
    ]
