import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

export const Appbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
  });
  const navigate = useNavigate();

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:3006/api/v1/profile/details", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      const user = res.data.user;
      setUser(user);

      // Save userId in localStorage for chat
      localStorage.setItem("userId", user._id);

      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        password: "",
      });
    } catch (err) {
      console.error("❌ Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        "http://localhost:3006/api/v1/profile/update",
        formData,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      setUser(res.data.user);
      setOpen(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert("Update failed!");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <>
      
      {/* Appbar */}
    <div className="h-16 bg-gradient-to-r from-white to-slate-50 backdrop-blur-md shadow-md border-b border-gray-200 flex justify-between items-center px-6">
      {/* Logo / App Name */}
      <div className="text-3xl font-extrabold text-slate-800 tracking-tight p-1">
        Pay<span className="text-blue-800">Link</span>
      </div>

      {/* User Greeting + Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-3 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
          onClick={() => setOpen(true)}
        >
          <div className="text-gray-700 font-medium text-sm">
            👋 Hello, <span className="font-semibold">{user.firstName}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-semibold ring-2 ring-blue-200 hover:scale-105 transition-transform">
            {user.firstName[0].toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => {
            // clear auth and redirect to signin
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            navigate('/signin');
          }}
          className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition text-sm"
          title="Logout"
        >
          Logout
        </button>
      </div>
    </div>


      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Profile Details</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Change Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="Leave blank to keep old password"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
