import os

from celery import Celery
from django.apps import AppConfig
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("complicity_graph")


class CeleryConfig(AppConfig):
    name = "taskapp"
    verbose_name = "Celery Config"

    def ready(self):
        # Using a string here means the worker will not have to
        # pickle the object when using Windows.
        app.config_from_object("django.conf:settings", namespace="CELERY")
        app.autodiscover_tasks(lambda: settings.INSTALLED_APPS, force=True)
