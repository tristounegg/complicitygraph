# Generated by Django 5.2.4 on 2025-08-02 10:37

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("graph", "0007_node_link_count"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="node",
            unique_together={("wd_id", "graph")},
        ),
    ]
