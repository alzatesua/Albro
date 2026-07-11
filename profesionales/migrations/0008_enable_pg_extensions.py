from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('profesionales', '0001_initial'),  # ajusta a tu última migración
    ]

    operations = [
        TrigramExtension(),
        UnaccentExtension(),
    ]