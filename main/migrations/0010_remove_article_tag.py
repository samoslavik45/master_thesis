# Generated by Django 5.0.2 on 2024-04-05 16:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0009_userarticletag'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='article',
            name='tag',
        ),
    ]
