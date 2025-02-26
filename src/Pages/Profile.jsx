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
      <div className="flex justify-center items-center min-h-screen text-blue-950">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-950 text-white px-6">
      <div className="bg-white text-blue-950 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>

        {editing ? (
          <>
            <input
              type="text"
              value={updatedName}
              onChange={(e) => setUpdatedName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <select
              value={updatedTravelClass}
              onChange={(e) => setUpdatedTravelClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            >
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
            </select>
            <button
              onClick={handleUpdate}
              className="w-full bg-blue-950 text-white p-2 rounded hover:bg-blue-900"
            >
              Save Changes
            </button>
          </>
        ) : (
          <>
            <p className="text-lg mb-2"><strong>Name:</strong> {userData?.name}</p>
            <p className="text-lg mb-2"><strong>Email:</strong> {userData?.email}</p>
            <p className="text-lg mb-4"><strong>Travel Class:</strong> {userData?.travelClass}</p>
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-blue-950 text-white p-2 rounded hover:bg-blue-900 mb-2"
            >
              Edit Profile
            </button>
          </>
        )}

        <h3 className="text-xl font-bold mt-4">Change Password</h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-2 mb-2"
          placeholder="New Password"
        />
        <button
          onClick={handleChangePassword}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Update Password
        </button>

        <h3 className="text-xl font-bold mt-4">Travel History</h3>
        <ul className="mt-2">
          {travelHistory.map((trip) => (
            <li key={trip.id} className="p-2 border-b border-gray-300">
              {trip.destination} - {trip.date} ({trip.class})
            </li>
          ))}
        </ul>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
