# Generated by Django 5.0.2 on 2024-03-06 11:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_category_tag_article_articlelike_group_keyword'),
    ]

    operations = [
        migrations.RenameField(
            model_name='article',
            old_name='author',
            new_name='added_by',
        ),
        migrations.RemoveField(
            model_name='keyword',
            name='articles',
        ),
        migrations.AddField(
            model_name='article',
            name='author_name',
            field=models.CharField(default='Neznámy autor', max_length=255),
        ),
        migrations.AddField(
            model_name='article',
            name='keywords',
            field=models.ManyToManyField(related_name='articles', to='main.keyword'),
        ),
    ]
