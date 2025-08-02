from rest_framework.routers import SimpleRouter

from .views import GraphViewSet

router = SimpleRouter()
router.register(r"graph", GraphViewSet, basename="graph")

urlpatterns = router.urls
