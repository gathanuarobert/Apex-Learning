import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../Api";

export default function PaymentComplete() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const navigate = useNavigate();
  const ref = searchParams.get("ref");
  const orderTrackingId = searchParams.get("OrderTrackingId");

  useEffect(() => {
    if (!ref) {
      setStatus("failed");
      return;
    }
    const check = async () => {
      try {
        const res = await api.get(
          `payments/payment/callback/?ref=${ref}&OrderTrackingId=${orderTrackingId}`,
        );
        setStatus(res.data.status);
      } catch {
        setStatus("failed");
      }
    };
    check();
  }, [ref, orderTrackingId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl">
        {status === "checking" && (
          <>
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Checking payment status...</p>
          </>
        )}
        {status === "completed" && (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-green-400 mb-2">
              Payment Successful!
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Your wallet has been topped up successfully!
            </p>
            <button
              onClick={() =>
                navigate("/user-dashboard", { state: { refreshWallet: true } })
              }
              className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-lg transition font-semibold w-full active:scale-95"
            >
              Go to Dashboard
            </button>
          </>
        )}
        {status === "pending" && (
          <>
            <p className="text-5xl mb-4">⏳</p>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
              Payment Pending
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              We're waiting for confirmation. Your balance will update shortly.
            </p>
            <button
              onClick={() =>
                navigate("/user-dashboard", { state: { refreshWallet: true } })
              }
              className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2.5 rounded-lg transition font-semibold w-full active:scale-95"
            >
              Go to Dashboard
            </button>
          </>
        )}
        {status === "failed" && (
          <>
            <p className="text-5xl mb-4">❌</p>
            <h2 className="text-xl font-bold text-red-400 mb-2">
              Payment Failed
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => navigate("/user-dashboard")}
              className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg transition font-semibold w-full active:scale-95"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
