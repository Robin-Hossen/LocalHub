
import { useRef, useState } from "react";
import {
  Upload,
  FileArchive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ImagePlus,
  X,
} from "lucide-react";

import { uploadBulkProductImages } from "../../services/bulkImageService";

function AdminBulkImageUploadPage() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectFile = (selectedFile) => {
    setError("");
    setResult(null);
    setProgress(0);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setError("Please select a ZIP file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("Selected ZIP file is empty.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("ZIP file size cannot exceed 50 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    try {
      setUploading(true);
      setError("");
      setResult(null);
      setProgress(0);

      const data = await uploadBulkProductImages(
        file,
        (event) => {
          if (event.total) {
            setProgress(
              Math.round((event.loaded * 100) / event.total)
            );
          }
        }
      );

      setResult(data);
      setProgress(100);
      setFile(null);
    } catch (err) {
      console.error("Bulk image upload error:", err);

      const responseData = err.response?.data;

      setError(
        responseData?.file?.[0] ||
        responseData?.error ||
        responseData?.detail ||
        "Unable to upload images. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError("");
    setProgress(0);
  };

  const formatSize = (bytes) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const ResultSection = ({ title, items, type, emptyText }) => {
    const styles = {
      success: "bg-green-50 border-green-200 text-green-700",
      warning: "bg-orange-50 border-orange-200 text-orange-700",
      danger: "bg-red-50 border-red-200 text-red-700",
      neutral: "bg-gray-50 border-gray-200 text-gray-700",
    };

    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[type]}`}>
            {items.length}
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto p-4">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-5 text-center text-sm text-gray-400">
              {emptyText}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Product Image Upload
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload multiple product images using a single ZIP file.
          </p>
        </div>

        {result && (
          <button
            onClick={resetUpload}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            New Upload
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <FileArchive className="mb-3 text-green-700" size={25} />
          <p className="text-sm text-gray-500">Supported Format</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">ZIP Archive</h3>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <ImagePlus className="mb-3 text-blue-600" size={25} />
          <p className="text-sm text-gray-500">Maximum Images</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">500 Files</h3>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Upload className="mb-3 text-orange-600" size={25} />
          <p className="text-sm text-gray-500">Maximum ZIP Size</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">50 MB</h3>
        </div>
      </div>

      {!result && (
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-lg font-bold text-gray-900">
            Select ZIP File
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Match image filenames with product SKUs.
          </p>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-12 text-center transition ${
              dragging
                ? "border-green-600 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50/50"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <div className="rounded-full bg-green-100 p-4 text-green-700">
              <Upload size={30} />
            </div>

            <h4 className="mt-4 font-semibold text-gray-800">
              Drag & drop your ZIP file here
            </h4>

            <p className="mt-2 text-sm text-gray-500">
              or click to browse files
            </p>

            <span className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              ZIP only · Maximum 50 MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <FileArchive className="shrink-0 text-green-700" size={27} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-800">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>

              <button
                disabled={uploading}
                onClick={() => setFile(null)}
                className="self-end rounded-lg p-2 text-gray-500 hover:bg-white sm:self-auto"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {uploading && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Uploading ZIP file...
                </span>
                <span className="font-semibold text-green-700">
                  {progress}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={17} />
                  Upload Images
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="space-y-5">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-700" size={28} />
              <div>
                <h3 className="font-bold text-green-800">
                  Upload Processing Completed
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Review the image upload results below.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Images",
                value: result.total_images,
                icon: ImagePlus,
                color: "text-gray-800",
              },
              {
                label: "Uploaded",
                value: result.uploaded_count,
                icon: CheckCircle2,
                color: "text-green-600",
              },
              {
                label: "Not Found",
                value: result.not_found_count,
                icon: XCircle,
                color: "text-red-600",
              },
              {
                label: "Invalid / Skipped",
                value: result.invalid_count + result.skipped_count,
                icon: AlertTriangle,
                color: "text-orange-600",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <Icon className={item.color} size={23} />
                  <p className="mt-3 text-sm text-gray-500">{item.label}</p>
                  <h3 className={`mt-1 text-3xl font-bold ${item.color}`}>
                    {item.value}
                  </h3>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ResultSection
              title="Successfully Uploaded"
              items={result.uploaded}
              type="success"
              emptyText="No images uploaded."
            />

            <ResultSection
              title="Products Not Found"
              items={result.not_found}
              type="danger"
              emptyText="No unmatched products."
            />

            <ResultSection
              title="Invalid Files"
              items={result.invalid}
              type="warning"
              emptyText="No invalid files."
            />

            <ResultSection
              title="Skipped Products"
              items={result.skipped}
              type="neutral"
              emptyText="No products skipped."
            />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-900">
          ZIP File Naming Instructions
        </h3>

        <p className="mt-2 text-sm text-blue-800">
          Each image filename must exactly match the product SKU.
          The file extension can be JPG, JPEG, PNG or WEBP.
        </p>

        <div className="mt-3 rounded-lg bg-white p-3 font-mono text-sm text-gray-700">
          RICE-001.jpg<br />
          PHAR-004.png<br />
          FRU-001.webp
        </div>

        <p className="mt-3 text-xs text-blue-800">
          Existing product images will be skipped, not overwritten.
          Only active products are eligible.
        </p>
      </section>
    </div>
  );
}

export default AdminBulkImageUploadPage;
