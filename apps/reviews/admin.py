from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'customer',
        'order',
        'product',
        'rating',
        'status',
        'created_at',
    )

    list_filter = (
        'status',
        'rating',
        'created_at',
    )

    search_fields = (
        'customer__email',
        'product__name',
        'order__order_number',
        'comment',
    )

    ordering = ('-created_at',)

    readonly_fields = (
        'customer',
        'order',
        'product',
        'rating',
        'comment',
        'created_at',
        'updated_at',
    )
