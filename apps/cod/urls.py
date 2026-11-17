from django.urls import path,include

from apps.cod.views import (
    CODCollectionCreateAPIView,
    CODCollectionListAPIView,
)

urlpatterns = [
    path(
        'collect/',
        CODCollectionCreateAPIView.as_view(),
        name='cod-collect'
    ),
    path(
        'collections/',
        CODCollectionListAPIView.as_view(),
        name='cod-collection-list'
    ),

    
]