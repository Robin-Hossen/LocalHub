import django_filters


class SalesReportFilter(django_filters.FilterSet):

    start_date = django_filters.DateFilter(
        field_name="created_at", lookup_expr="date__gte"
    )

    end_date = django_filters.DateFilter(
        field_name="created_at", lookup_expr="date__lte"
    )
