from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('profesionales', '0006_perfilprofesional_imagen_perfil'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE profesionales_perfilprofesional
            DROP COLUMN IF EXISTS estado;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
