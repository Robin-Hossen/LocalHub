
from django.db.models import Q
from django.utils import timezone

from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Banner
from .serializers import BannerSerializer, PublicBannerSerializer
from .permissions import IsAdminOrOperations


class PublicBannerListAPIView(generics.ListAPIView):
    serializer_class = PublicBannerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        now = timezone.now()

        queryset = Banner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gt=now)
        )

        placement = self.request.query_params.get('placement')

        if placement:
            queryset = queryset.filter(placement=placement.upper())

        return queryset.order_by('position', '-created_at')

    
class PublicBannerDetailAPIView(generics.RetrieveAPIView):
    serializer_class = PublicBannerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        now = timezone.now()

        return Banner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gt=now)
        )



class StaffBannerListCreateAPIView(generics.ListCreateAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdminOrOperations]


class StaffBannerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdminOrOperations]
