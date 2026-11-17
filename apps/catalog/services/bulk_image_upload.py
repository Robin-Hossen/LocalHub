import os
import zipfile
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from django.core.files.base import ContentFile
from django.db import transaction

from apps.catalog.models import Product

ALLOWED_FORMATS = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
}

MAX_IMAGES = 500
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_TOTAL_SIZE = 100 * 1024 * 1024


def validate_image(content, extension):
    try:
        image = Image.open(BytesIO(content))

        expected_format = ALLOWED_FORMATS.get(extension.lower())

        if image.format != expected_format:
            return False

        image.verify()

        return True

    except (UnidentifiedImageError, OSError, ValueError):
        return False


@transaction.atomic


def bulk_upload_product_images(zip_file):

    results = {
        "total_images": 0,
        "uploaded": [],
        "not_found": [],
        "invalid": [],
        "skipped": [],
    }

    uploaded_files = []

    try:
        with transaction.atomic():

            seen_skus = set()
            total_uncompressed_size = 0

            with zipfile.ZipFile(zip_file) as archive:

                file_entries = [
                    info for info in archive.infolist() if not info.is_dir()
                ]

                if len(file_entries) > MAX_IMAGES:
                    raise ValueError(
                        f"ZIP cannot contain more than {MAX_IMAGES} files."
                    )

                for info in file_entries:

                    normalized_name = info.filename.replace("\\", "/")

                    if (
                        normalized_name.startswith("/")
                        or ".." in normalized_name.split("/")
                        or info.flag_bits & 0x1
                    ):
                        raise ValueError("ZIP contains an unsafe or encrypted file.")

                    total_uncompressed_size += info.file_size

                    if info.file_size > MAX_IMAGE_SIZE:
                        raise ValueError("An image exceeds the 5 MB size limit.")

                if total_uncompressed_size > MAX_TOTAL_SIZE:
                    raise ValueError(
                        "Total uncompressed ZIP size cannot exceed 100 MB."
                    )

                if archive.testzip() is not None:
                    raise ValueError("ZIP contains a corrupted file.")

                for file_info in file_entries:

                    filename = os.path.basename(file_info.filename.replace("\\", "/"))

                    sku, extension = os.path.splitext(filename)
                    extension = extension.lower()

                    if extension not in ALLOWED_FORMATS or not sku:
                        results["invalid"].append(filename)
                        continue

                    results["total_images"] += 1

                    if sku in seen_skus:
                        results["invalid"].append(filename)
                        continue

                    seen_skus.add(sku)

                    product = Product.objects.filter(
                        sku=sku,
                        is_active=True,
                    ).first()

                    if not product:
                        results["not_found"].append(sku)
                        continue

                    if product.image:
                        results["skipped"].append(sku)
                        continue

                    image_content = archive.read(file_info)

                    if not validate_image(image_content, extension):
                        results["invalid"].append(filename)
                        continue

                    storage = product.image.storage

                    stored_name = storage.save(
                        f"products/{filename}",
                        ContentFile(image_content),
                    )

                    # Track file immediately for rollback cleanup
                    uploaded_files.append((storage, stored_name))

                    product.image.name = stored_name
                    product.save(update_fields=["image"])

                    results["uploaded"].append(sku)

        results["uploaded_count"] = len(results["uploaded"])
        results["not_found_count"] = len(results["not_found"])
        results["invalid_count"] = len(results["invalid"])
        results["skipped_count"] = len(results["skipped"])

        return results

    except Exception:
        # Database transaction has rolled back.
        # Remove files already written to storage.
        for storage, filename in uploaded_files:
            try:
                storage.delete(filename)
            except Exception:
                pass

        raise
