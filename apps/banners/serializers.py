
from rest_framework import serializers
from .models import Banner


class BannerSerializer(serializers.ModelSerializer):

    def to_internal_value(self, data):
        data = data.copy()

        for field in ('start_date', 'end_date'):
            if data.get(field) == '':
                data[field] = None

        return super().to_internal_value(data)

    class Meta:
        model = Banner
        fields = '__all__'
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )


    def validate_image(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                'Image size cannot exceed 5 MB.'
            )

        return image

    def validate(self, attrs):
        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )

        end_date = attrs.get(
            'end_date',
            getattr(self.instance, 'end_date', None)
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be later than start date.'
            })

        return attrs


class PublicBannerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Banner
        fields = (
            'id',
            'title',
            'subtitle',
            'image',
            'layout',
            'button_text',
            'button_link',
            'position',
        )
