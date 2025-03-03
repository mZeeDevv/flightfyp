import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedTravelClass, setUpdatedTravelClass] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [travelHistory, setTravelHistory] = useState([
    { id: 1, destination: "New York", date: "2023-12-20", class: "Economy" },
    { id: 2, destination: "London", date: "2023-10-15", class: "Business" },
  ]);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setUpdatedName(data.name);
          setUpdatedTravelClass(data.travelClass);
        }
      } catch (error) {
        toast.error("Error fetching user data");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const handleUpdate = async () => {
    if (!userData) return;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        name: updatedName,
        travelClass: updatedTravelClass,
      });

      setUserData((prev) => ({
        ...prev,
        name: updatedName,
        travelClass: updatedTravelClass,
      }));

      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Error updating profile");
      console.error("Error updating profile:", error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { password: newPassword });

      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (error) {
      toast.error("Error updating password");
      console.error("Error updating password:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <p className="text-white text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Your Profile</h2>

          {/* Profile Section */}
          <div className="mb-8">
            {editing ? (
              <>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={updatedName}
                    onChange={(e) => setUpdatedName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                  />
                  <select
                    value={updatedTravelClass}
                    onChange={(e) => setUpdatedTravelClass(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                  </select>
                  <button
                    onClick={handleUpdate}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <p className="text-lg text-gray-700"><strong>Name:</strong> {userData?.name}</p>
                  <p className="text-lg text-gray-700"><strong>Email:</strong> {userData?.email}</p>
                  <p className="text-lg text-gray-700"><strong>Travel Class:</strong> {userData?.travelClass}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Change Password Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Change Password</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New Password"
            />
            <button
              onClick={handleChangePassword}
              className="w-full bg-green-600 text-white p-3 rounded-lg mt-4 hover:bg-green-700 transition duration-300"
            >
              Update Password
            </button>
          </div>

          {/* Travel History Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Travel History</h3>
            <ul className="space-y-3">
              {travelHistory.map((trip) => (
                <li
                  key={trip.id}
                  className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <p className="text-gray-700"><strong>Destination:</strong> {trip.destination}</p>
                  <p className="text-gray-700"><strong>Date:</strong> {trip.date}</p>
                  <p className="text-gray-700"><strong>Class:</strong> {trip.class}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white p-3 rounded-lg mt-8 hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}