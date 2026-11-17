
from django.contrib import admin
from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):

    list_display = (
        'title',
        'layout',
        'position',
        'is_active',
        'start_date',
        'end_date',
        'created_at',
    )

    list_filter = (
        'is_active',
        'layout',
    )

    search_fields = (
        'title',
        'subtitle',
    )

    ordering = ('position', '-created_at')

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    fieldsets = (
        ('Banner Information', {
            'fields': (
                'title',
                'subtitle',
                'image',
                'layout',
            )
        }),
        ('Call To Action', {
            'fields': (
                'button_text',
                'button_link',
            )
        }),
        ('Display Settings', {
            'fields': (
                'position',
                'is_active',
                'start_date',
                'end_date',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
