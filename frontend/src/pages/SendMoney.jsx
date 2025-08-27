import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export const SendMoney = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // receiver's userId
  const name = searchParams.get("name"); // receiver's name
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState(""); // optional
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTransfer = async () => {
    setError("");
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(
  "https://paylink-2.onrender.com/api/v1/account/transfer",
        {
          to: id,
          amount: Number(amount),
          description: description || `Sent to ${name}`, // optional description
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLoading(false);
      setSuccess(true);

      // Redirect after animation
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Transaction failed");
    }
  };

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="h-full flex flex-col justify-center">
        <div className="border h-min max-w-md p-6 space-y-8 w-96 bg-white shadow-lg rounded-lg">
          {!success ? (
            <>
              <div className="flex flex-col space-y-1.5 p-4">
                <h2 className="text-3xl font-bold text-center">Send Money</h2>
              </div>

              <div className="p-4 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-2xl text-white">
                      {name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold">{name}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="amount"
                    >
                      Amount (in Rs)
                    </label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      id="amount"
                      placeholder="Enter amount"
                      className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="description"
                    >
                      Description (optional)
                    </label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      type="text"
                      id="description"
                      placeholder="Add a note"
                      className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  <button
                    onClick={handleTransfer}
                    disabled={loading}
                    className={`justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full 
                      ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                  >
                    {loading ? "Processing..." : "Initiate Transfer"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center p-6">
              <div className="w-20 h-20 flex items-center justify-center rounded-full border-4 border-green-500 animate-bounce">
                <svg
                  className="w-10 h-10 text-green-500 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-green-600 animate-fade-in">
                Transfer Successful!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-in forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
