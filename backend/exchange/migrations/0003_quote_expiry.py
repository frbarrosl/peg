from datetime import timedelta

from django.db import migrations, models


def populate_expires_at(apps, schema_editor):
    Quote = apps.get_model('exchange', 'Quote')
    for quote in Quote.objects.all():
        quote.expires_at = quote.created_at + timedelta(minutes=5)
        quote.save(update_fields=['expires_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('exchange', '0002_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='expires_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='quote',
            name='status',
            field=models.CharField(
                choices=[
                    ('DRAFT', 'Draft'),
                    ('PENDING', 'Pending'),
                    ('COMPLETED', 'Completed'),
                    ('EXPIRED', 'Expired'),
                ],
                default='DRAFT',
                max_length=20,
            ),
        ),
        migrations.RunPython(populate_expires_at, migrations.RunPython.noop),
    ]
