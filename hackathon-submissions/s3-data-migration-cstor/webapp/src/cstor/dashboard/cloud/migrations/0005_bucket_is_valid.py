# Generated by Django 4.0.4 on 2022-05-20 08:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cloud', '0004_cloudprovider_cloud_cred_uuid'),
    ]

    operations = [
        migrations.AddField(
            model_name='bucket',
            name='is_valid',
            field=models.BooleanField(default=True),
        ),
    ]
