from django.contrib import admin
from .models import Category,Product



@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'slug',
        'parent',
        'is_active',
        'created_at',
    )

    search_fields = ('name', 'slug')

    list_filter = ('is_active', 'parent')

    prepopulated_fields = {
        'slug': ('name',)
    }




@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'sku',
        'category',
        'vendor',
        'selling_price',
        'cost_price',
        'is_available',
        'is_active',
    )

    search_fields = (
        'name',
        'sku',
        'vendor__name',
    )

    list_filter = (
        'category',
        'vendor',
        'is_available',
        'is_active',
    )