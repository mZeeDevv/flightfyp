import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { toast } from "react-toastify";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "react-toastify/dist/ReactToastify.css";
import { FaPlane, FaHotel, FaUser, FaLock, FaEdit, FaSave, FaSuitcase, FaTrash } from "react-icons/fa";
import Spinner from '../Components/Spinner'; // Import the Spinner component
import DashboardData from '../UsesDashboard/Dashboard'; // Import the DashboardData component

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedTravelClass, setUpdatedTravelClass] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [showReauthenticate, setShowReauthenticate] = useState(false);  
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
          setProfilePictureUrl(data.profilePictureUrl || "");
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
        profilePictureUrl,
      });

      setUserData((prev) => ({
        ...prev,
        name: updatedName,
        travelClass: updatedTravelClass,
        profilePictureUrl,
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    if (!file) return;

    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress tracking (optional)
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        toast.error("Error uploading profile picture");
        console.error("Error uploading profile picture:", error);
        setUploading(false);
      },
      () => {
        // Upload completed successfully
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setProfilePictureUrl(downloadURL);
          setUploading(false);
          toast.success("Profile picture uploaded successfully");
        });
      }
    );
  };

  const handleDeleteAccount = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error("You must be logged in to delete your account");
        return;
      }
      
      // Delete user document from Firestore
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      
      // Delete user from Firebase Authentication
      await deleteUser(currentUser);
      
      // Clear localStorage
      localStorage.removeItem("userId");
      
      // Show success message
      toast.success("Account deleted successfully");
      
      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      
      // If error code indicates re-authentication is needed
      if (error.code === 'auth/requires-recent-login') {
        setShowReauthenticate(true);
        toast.error("For security, please re-enter your password to delete your account");
      } else {
        toast.error("Error deleting account: " + error.message);
      }
    }
  };
  
  const handleReauthenticate = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser || !userData) {
        toast.error("You must be logged in to delete your account");
        return;
      }
      
      // Create credential with the user's email and provided password
      const credential = EmailAuthProvider.credential(
        userData.email,
        password
      );
      
      // Reauthenticate
      await reauthenticateWithCredential(currentUser, credential);
      
      // Now try deleting again
      await handleDeleteAccount();
      
      setShowReauthenticate(false);
    } catch (error) {
      console.error("Error reauthenticating:", error);
      toast.error("Incorrect password. Please try again.");
    }
  };

  // Show Spinner while loading or uploading
  if (loading || uploading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Dashboard Overview */}
      <DashboardData userId={userId}>
        {({ dashboardData, loading: dashboardLoading }) => {
          if (dashboardLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <Spinner />
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Flights Card */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                <div className="bg-blue-100 p-4 rounded-full mr-4">
                  <FaPlane className="text-blue-500 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-600">Flights Taken</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData.flights}</p>
                </div>
              </div>

              {/* Total Trips Card */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                <div className="bg-green-100 p-4 rounded-full mr-4">
                  <FaSuitcase className="text-green-500 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData.trips}</p>
                </div>
              </div>

              {/* Hotels Booked Card */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                <div className="bg-purple-100 p-4 rounded-full mr-4">
                  <FaHotel className="text-purple-500 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-600">Hotels Booked</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData.hotels}</p>
                </div>
              </div>
            </div>
          );
        }}
      </DashboardData>

      {/* Rest of the Profile Component */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Your Profile</h2>

          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">No Image</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="mt-4"
              disabled={uploading}
            />
            {uploading && <p className="text-gray-600 mt-2">Uploading...</p>}
          </div>

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
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                  >
                    <FaSave className="mr-2" /> Save Changes
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
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                  >
                    <FaEdit className="mr-2" /> Edit Profile
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
              className="w-full bg-green-600 text-white p-3 rounded-lg mt-4 hover:bg-green-700 transition duration-300 flex items-center justify-center"
            >
              <FaLock className="mr-2" /> Update Password
            </button>
          </div>

          {/* Delete Account Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone. All your data will be permanently deleted.</p>
            
            {showReauthenticate ? (
              <div className="space-y-4">
                <p className="text-red-600 font-semibold">For security reasons, please enter your password to confirm:</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your password"
                />
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowReauthenticate(false)}
                    className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReauthenticate}
                    className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" /> Confirm Delete
                  </button>
                </div>
              </div>
            ) : showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-red-600 font-semibold">Are you sure you want to delete your account?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" /> Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center"
              >
                <FaTrash className="mr-2" /> Delete My Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}