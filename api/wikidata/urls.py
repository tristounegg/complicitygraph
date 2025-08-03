from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register(r"country", views.CountryViewSet, basename="country")
router.register(r"accomplice", views.AccompliceViewSet, basename="accomplice")

urlpatterns = router.urls
