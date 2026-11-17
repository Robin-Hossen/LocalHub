from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.dashboard.permissions import IsAdminOrOperations
from apps.dashboard.services import get_order_dashboard_summary
from apps.dashboard.serializers import OrderDashboardSummarySerializer

from apps.dashboard.services import get_customer_dashboard_summary
from apps.dashboard.serializers import CustomerDashboardSummarySerializer

from apps.dashboard.services import get_inventory_dashboard_summary

from apps.dashboard.serializers import InventoryDashboardSummarySerializer

from apps.dashboard.services import get_procurement_dashboard_summary
from apps.dashboard.serializers import ProcurementDashboardSummarySerializer

from apps.dashboard.services import get_vendor_dashboard_summary
from apps.dashboard.serializers import VendorDashboardSummarySerializer

from apps.dashboard.services import get_cod_dashboard_summary
from apps.dashboard.serializers import CODDashboardSummarySerializer

from apps.dashboard.services import get_dashboard_overview
from apps.dashboard.serializers import DashboardOverviewSerializer


class OrderDashboardSummaryAPIView(APIView):
    serializer_class=OrderDashboardSummarySerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations,
    ]

    def get(self, request):

        summary = get_order_dashboard_summary()

        serializer = OrderDashboardSummarySerializer(
            summary
        )

        return Response(serializer.data)



class InventoryDashboardSummaryAPIView(APIView):
    serializer_class = InventoryDashboardSummarySerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrOperations,
    ]

    def get(self, request):

        summary = get_inventory_dashboard_summary()

        serializer = InventoryDashboardSummarySerializer(
            summary
        )

        return Response(serializer.data)


class CustomerDashboardSummaryAPIView(APIView):
    serializer_class = CustomerDashboardSummarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get(self, request):
        summary = get_customer_dashboard_summary()

        serializer = CustomerDashboardSummarySerializer(summary)

        return Response(serializer.data)


class ProcurementDashboardSummaryAPIView(APIView):
    serializer_class = ProcurementDashboardSummarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get(self, request):
        summary = get_procurement_dashboard_summary()

        serializer = ProcurementDashboardSummarySerializer(summary)

        return Response(serializer.data)    


class VendorDashboardSummaryAPIView(APIView):
    serializer_class = VendorDashboardSummarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get(self, request):
        summary = get_vendor_dashboard_summary()

        serializer = VendorDashboardSummarySerializer(summary)

        return Response(serializer.data)    


class CODDashboardSummaryAPIView(APIView):
    serializer_class = CODDashboardSummarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get(self, request):
        summary = get_cod_dashboard_summary()

        serializer = CODDashboardSummarySerializer(summary)

        return Response(serializer.data)    


class DashboardOverviewAPIView(APIView):
    serializer_class = 	DashboardOverviewSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperations]

    def get(self, request):
        overview = get_dashboard_overview()

        serializer = DashboardOverviewSerializer(overview)

        return Response(serializer.data)    