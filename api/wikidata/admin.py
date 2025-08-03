from django.contrib import admin

from . import models

admin.site.register(models.WikidataEdge)
admin.site.register(models.Country)


@admin.register(models.Accomplice)
class AccompliceAdmin(admin.ModelAdmin):
    list_display = ["label", "id", "base", "updated_at", "country"]
    search_fields = ["label", "id"]
    list_select_related = True
    readonly_fields = ["instance_of", "country"]

    def instance_of(self, obj):
        return ", ".join(str(i.label or i.id) for i in obj.instance_of.all())

    def country(self, obj):
        return ", ".join(str(i.label or i.id) for i in obj.country.all())
