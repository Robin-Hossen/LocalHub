import { Check, Circle, Package, XCircle } from "lucide-react";

const trackingSteps = [
  { status: "PENDING", label: "Order Placed" },
  { status: "CONFIRMED", label: "Order Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

function OrderTracking({ status }) {
  if (status === "CANCELLED") {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle size={24} />
          <h3 className="font-bold text-lg">Order Cancelled</h3>
        </div>

        <p className="text-sm text-red-600 mt-2">
          This order has been cancelled.
        </p>
      </div>
    );
  }

  const currentIndex = trackingSteps.findIndex(
    (step) => step.status === status,
  );

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="text-green-600" size={22} />
        <h3 className="font-bold text-lg text-gray-800">Order Tracking</h3>
      </div>

      <div className="space-y-6">
        {trackingSteps.map((step, index) => {
          const completed = index <= currentIndex;
          const current = index === currentIndex;

          return (
            <div key={step.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    completed
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {completed ? <Check size={19} /> : <Circle size={18} />}
                </div>

                {index !== trackingSteps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      index < currentIndex ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              <div className="pt-1">
                <p
                  className={`font-semibold ${
                    completed ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>

                {current && (
                  <p className="text-xs text-green-600 mt-1">Current Status</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTracking;
