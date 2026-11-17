
import api from "./api";

export const uploadBulkProductImages = async (file, onUploadProgress) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/catalog/staff/products/bulk-image-upload/",
    formData,
    {
      onUploadProgress,
    }
  );

  return response.data;
};
