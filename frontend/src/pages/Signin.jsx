import { useState } from "react";
import { BottomWarning } from "../components/BottomWarning";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignin = async () => {
    try {
      const response = await axios.post("http://localhost:3006/api/v1/user/signin", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Signin failed");
    }
  };

  const handleGoogleResponse = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) throw new Error("Google credential missing");

      const resp = await axios.post("http://localhost:3006/api/v1/user/google-auth", {
        token: idToken,
      });

      localStorage.setItem("token", resp.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Google signin failed");
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-md w-96 px-8 py-10">
        {/* Heading */}
        <div className="flex justify-center ">
          <Heading label="Log in" />

        </div>
        <SubHeading label="Enter your credentials to access your account" />

        {/* Inputs */}
        <div className="mt-6 space-y-5">
          <InputBox
            onChange={(e) => setUsername(e.target.value)}
            placeholder="abcd@gmail.com"
            label="Email"
          />
          <InputBox
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            label="Password"
            type="password"
          />
        </div>

        {/* Button */}
        <div className="mt-6">
          <Button
            onClick={handleSignin}
            label="Sign in"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg transition"
          />
        </div>

        {/* Google Login */}
        <div className="mt-4 flex justify-center">
          <GoogleLogin onSuccess={handleGoogleResponse} onError={() => alert('Google sign-in failed')} />
        </div>

        {/* Bottom Warning */}
        <div className="mt-6">
          <BottomWarning
            label="Don't have an account?"
            buttonText="Sign up"
            to="/signup"
          />
        </div>
      </div>
    </div>
  );
};
