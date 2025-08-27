

import { useState } from "react";
import { BottomWarning } from "../components/BottomWarning";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import { OTPVerification } from "../components/OTPVerification";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

export const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("signup"); // 'signup' or 'otp'
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    // Basic validation
    if (!firstName || !lastName || !username || !password) {
      setMessage("All fields are required");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setMessage("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
  const response = await axios.post("https://paylink-2.onrender.com/api/v1/user/request-otp", {
        username,
        firstName,
        lastName,
        password,
      });

      setMessage("");
      setUserData({ firstName, lastName, username, password });
      setStep("otp");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleGoogleResponse = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) throw new Error('Google credential missing');

  const resp = await axios.post('https://paylink-2.onrender.com/api/v1/user/google-auth', { token: idToken });
      localStorage.setItem('token', resp.data.token);
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Google signup failed');
    }
  };

  if (step === "otp") {
    return <OTPVerification userData={userData} onBack={() => setStep("signup")} />;
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md px-8 py-10 mx-4">
        <div className="flex justify-center">
          <Heading label="Create Account" />
        </div>
        
        <SubHeading label="Enter your information to create an account" />

        {message && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {message}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <InputBox
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            label="First Name"
            value={firstName}
            disabled={loading}
          />
          <InputBox
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            label="Last Name"
            value={lastName}
            disabled={loading}
          />
          <InputBox
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your.email@gmail.com"
            label="Email"
            type="email"
            value={username}
            disabled={loading}
          />
          <InputBox
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            label="Password"
            type="password"
            value={password}
            disabled={loading}
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={handleRequestOTP}
            label={loading ? "Sending OTP..." : "Send OTP"}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>

        <div className="mt-4 flex justify-center">
          <GoogleLogin onSuccess={handleGoogleResponse} onError={() => setMessage('Google sign-in failed')} />
        </div>

        <div className="mt-6">
          <BottomWarning
            label="Already have an account?"
            buttonText="Sign in"
            to="/signin"
          />
        </div>
      </div>
    </div>
  );
};