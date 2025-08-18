from django.db import migrations


def fix_download_transactions(apps, schema_editor):
    Transaction = apps.get_model("payments", "Transaction")

    # Update old "download" rows to "purchase"
    Transaction.objects.filter(transaction_type="download").update(transaction_type="purchase")


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(fix_download_transactions, reverse_code=migrations.RunPython.noop),
    ]
