from django.urls import path

from . import views

urlpatterns = [
    path("upgrade", views.upgrade, name="upgrade"),
    path("base", views.base, name="base"),
    path("iteration", views.iteration, name="iteration"),
    path("ceo", views.ceo, name="ceo"),
    path("graph", views.graph, name="graph"),
]
