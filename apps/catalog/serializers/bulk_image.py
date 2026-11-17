import zipfile

from rest_framework import serializers


class BulkProductImageUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):

        # Maximum compressed ZIP size: 50 MB
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("ZIP file size cannot exceed 50 MB.")

        if value.size == 0:
            raise serializers.ValidationError("Uploaded ZIP file is empty.")

        value.seek(0)

        try:
            with zipfile.ZipFile(value) as archive:

                file_entries = [
                    info for info in archive.infolist() if not info.is_dir()
                ]

                if not file_entries:
                    raise serializers.ValidationError(
                        "ZIP file does not contain any files."
                    )

                if len(file_entries) > 500:
                    raise serializers.ValidationError(
                        "ZIP cannot contain more than 500 files."
                    )

                value.seek(0)

        except zipfile.BadZipFile:
            raise serializers.ValidationError("Please upload a valid ZIP file.")

        finally:
            value.seek(0)

        return value
