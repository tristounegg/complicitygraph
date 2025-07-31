from django.contrib import admin
from . import models

admin.site.register(models.GraphEdge)


@admin.register(models.Accomplice)
class AccompliceAdmin(admin.ModelAdmin):
    list_display = ["label", "id", "base", "distance_to_center"]
    search_fields = ["label", "id"]
    list_select_related = True
    readonly_fields = ["instance_of"]

    def instance_of(self, obj):
        return ", ".join(str(i.label or i.id) for i in obj.instance_of.all())
