import { useState, useEffect } from "react";
import { BottomWarning } from "./BottomWarning";
import { Button } from "./Button";
import { Heading } from "./Heading";
import { InputBox } from "./InputBox";
import { SubHeading } from "./SubHeading";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const OTPVerification = ({ userData, onBack }) => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
  const response = await axios.post("https://paylink-2.onrender.com/api/v1/user/verify-otp", {
        ...userData,
        otp,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setMessage("");

    try {
  await axios.post("https://paylink-2.onrender.com/api/v1/user/resend-otp", {
        username: userData.username,
      });
      setTimer(600); // Reset timer to 10 minutes
      setMessage("OTP resent to your email");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md px-8 py-10 mx-4">
        <div className="flex justify-center">
          <Heading label="Verify Email" />
        </div>
        
        <SubHeading label={`Enter the OTP sent to ${userData?.username || 'your email'}`} />
        
        <div className="mt-6">
          <InputBox
            onChange={(e) => {
              setOtp(e.target.value);
              setMessage(""); // Clear error when user starts typing
            }}
            placeholder="Enter 6-digit OTP"
            label="OTP"
            type="text"
            maxLength="6"
            value={otp}
            disabled={loading}
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Time remaining: {formatTime(timer)}
          {timer === 0 && " - OTP expired"}
        </div>

        {message && (
          <div className={`mt-4 p-3 text-sm rounded-lg ${
            message.includes("resent") 
              ? "text-green-600 bg-green-50" 
              : "text-red-600 bg-red-50"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleVerifyOTP}
            label={loading ? "Verifying..." : "Verify OTP"}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || timer === 0}
          />
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleResendOTP}
            className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={resendLoading || timer > 540} // Can resend after 1 minute
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 text-sm"
            disabled={loading}
          >
            Back to Signup
          </button>
        </div>
      </div>
    </div>
  );
};