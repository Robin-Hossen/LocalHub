from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.dashboard.permissions import IsAdminOrOperations
from apps.reports.services import get_sales_summary
from apps.reports.serializers import SalesSummarySerializer
from apps.reports.filters import SalesReportFilter


from apps.orders.models import Order

from apps.reports.services import get_daily_sales_report
from apps.reports.serializers import DailySalesReportSerializer

from apps.reports.services import get_monthly_sales_report
from apps.reports.serializers import MonthlySalesReportSerializer

from apps.reports.services import get_product_sales_report
from apps.reports.serializers import ProductSalesReportSerializer

from apps.reports.services import get_vendor_purchase_report
from apps.reports.serializers import VendorPurchaseReportSerializer

from apps.reports.services import (
    get_inventory_report,
    get_delivery_performance_report,
)

from apps.reports.serializers import (
    InventoryReportSerializer,
    DeliveryPerformanceReportSerializer,
)

class SalesSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = SalesSummarySerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params,
            queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(
                report_filter.errors,
                status=400
            )

        start_date = report_filter.form.cleaned_data.get('start_date')
        end_date = report_filter.form.cleaned_data.get('end_date')

        summary = get_sales_summary(
            start_date=start_date,
            end_date=end_date
        )

        serializer = self.serializer_class(summary)

        return Response(serializer.data)


class DailySalesReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = DailySalesReportSerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params,
            queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(
                report_filter.errors,
                status=400
            )

        start_date = report_filter.form.cleaned_data.get('start_date')
        end_date = report_filter.form.cleaned_data.get('end_date')

        reports = get_daily_sales_report(
            start_date=start_date,
            end_date=end_date
        )

        serializer = self.serializer_class(
            reports,
            many=True
        )

        return Response(serializer.data)

class MonthlySalesReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = MonthlySalesReportSerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params,
            queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(
                report_filter.errors,
                status=400
            )

        start_date = report_filter.form.cleaned_data.get('start_date')
        end_date = report_filter.form.cleaned_data.get('end_date')

        reports = get_monthly_sales_report(
            start_date=start_date,
            end_date=end_date
        )

        serializer = self.serializer_class(
            reports,
            many=True
        )

        return Response(serializer.data)    


class ProductSalesReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = ProductSalesReportSerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params,
            queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(
                report_filter.errors,
                status=400
            )

        start_date = report_filter.form.cleaned_data.get('start_date')
        end_date = report_filter.form.cleaned_data.get('end_date')

        reports = get_product_sales_report(
            start_date=start_date,
            end_date=end_date
        )

        serializer = self.serializer_class(
            reports,
            many=True
        )

        return Response(serializer.data)


class VendorPurchaseReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = VendorPurchaseReportSerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params,
            queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(
                report_filter.errors,
                status=400
            )

        start_date = report_filter.form.cleaned_data.get('start_date')
        end_date = report_filter.form.cleaned_data.get('end_date')

        reports = get_vendor_purchase_report(
            start_date=start_date,
            end_date=end_date
        )

        serializer = self.serializer_class(
            reports,
            many=True
        )

        return Response(serializer.data)    


class InventoryReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = InventoryReportSerializer

    def get(self, request):
        reports = get_inventory_report()

        serializer = self.serializer_class(reports, many=True)

        return Response(serializer.data)


class DeliveryPerformanceReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOperations]
    serializer_class = DeliveryPerformanceReportSerializer

    def get(self, request):
        report_filter = SalesReportFilter(
            data=request.query_params, queryset=Order.objects.all()
        )

        if not report_filter.is_valid():
            return Response(report_filter.errors, status=400)

        start_date = report_filter.form.cleaned_data.get("start_date")
        end_date = report_filter.form.cleaned_data.get("end_date")

        reports = get_delivery_performance_report(
            start_date=start_date, end_date=end_date
        )

        serializer = self.serializer_class(reports)

        return Response(serializer.data)
