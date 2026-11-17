from rest_framework import serializers

from apps.catalog.models import Category


class CategorySerializer(serializers.ModelSerializer):

    parent_name = serializers.CharField(
        source="parent.name",
        read_only=True,
    )

    class Meta:
        model = Category

        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "parent",
            "parent_name",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_parent(self, value):

        if value and not value.is_active:
            raise serializers.ValidationError("Parent category is inactive.")

        if self.instance and value:

            if value == self.instance:
                raise serializers.ValidationError(
                    "A category cannot be its own parent."
                )

        current_parent = value
        visited = set()

        while current_parent:

            if current_parent.pk in visited:
                raise serializers.ValidationError(
                    "Circular category hierarchy detected."
                )

            visited.add(current_parent.pk)

            if self.instance and current_parent == self.instance:
                raise serializers.ValidationError(
                    "Circular parent-child relationship is not allowed."
                )

            current_parent = current_parent.parent

        return value
