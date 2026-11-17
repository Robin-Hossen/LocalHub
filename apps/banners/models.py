
from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


class Banner(models.Model):

    class Layout(models.TextChoices):
        FULL_WIDTH = 'FULL_WIDTH', 'Full Width'
        LEFT_IMAGE = 'LEFT_IMAGE', 'Image Left'
        RIGHT_IMAGE = 'RIGHT_IMAGE', 'Image Right'
    class Placement(models.TextChoices):
        HERO = 'HERO', 'Hero Banner'
        PROMOTIONAL = 'PROMOTIONAL', 'Promotional Banner'    

    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    

    image = models.ImageField(
        upload_to='banners/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp']
            )
        ]
    )

    layout = models.CharField(
        max_length=20,
        choices=Layout.choices,
        default=Layout.FULL_WIDTH
    )
    placement = models.CharField(
            max_length=20,
            choices=Placement.choices,
            default=Placement.HERO,
            db_index=True
    )

    button_text = models.CharField(max_length=50, blank=True)
    button_link = models.CharField(max_length=500, blank=True)

    position = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    start_date = models.DateTimeField(
        null=True,
        blank=True
    )

    end_date = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', '-created_at']
        indexes = [
            models.Index(
                fields=['is_active', 'position'],
                name='banner_active_position_idx'
            )
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(start_date__isnull=True)
                    | models.Q(end_date__isnull=True)
                    | models.Q(end_date__gt=models.F('start_date'))
                ),
                name='banner_end_after_start'
            )
        ]

    def clean(self):
        super().clean()

        if (
            self.start_date
            and self.end_date
            and self.end_date <= self.start_date
        ):
            raise ValidationError({
                'end_date': 'End date must be later than start date.'
            })

    def __str__(self):
        return self.title
