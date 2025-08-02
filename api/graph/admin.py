from django.contrib import admin

from . import models

admin.site.register(models.Graph)


@admin.register(models.Node)
class NodeAdmin(admin.ModelAdmin):
    list_display = [
        "label",
        "wd_id",
        "graph",
        "radius",
        "colour",
        "group",
    ]
    search_fields = ["label", "wd_id"]
    list_select_related = True
    readonly_fields = ["instance_of"]


@admin.register(models.Edge)
class EdgeAdmin(admin.ModelAdmin):
    list_display = [
        "source",
        "target",
    ]
    search_fields = ["source__wd_id", "target__wd_id"]
    list_select_related = True
