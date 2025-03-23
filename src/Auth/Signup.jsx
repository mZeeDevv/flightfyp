import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db } from "../firebase";
import flightImage from "../assets/flight.png";
import { toast } from "react-toastify";
export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    travelClass: "Economy",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const auth = getAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
    }
  };

  // Validate password
  const isPasswordValid = (password) => {
    return password.length >= 6; // You can add more conditions
  };

  // Upload profile picture to Firebase Storage
  const uploadProfilePicture = async (file, userId) => {
    if (!file) return null;

    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress tracking (optional)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          // Upload completed successfully
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!isPasswordValid(formData.password)) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setUploading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const userId = user.uid; // Get the Firebase user ID

      // Send email verification link
      await sendEmailVerification(user);
      toast.success("Account created successfully! Please verify your email.");

      // Upload profile picture to Firebase Storage
      let profilePictureUrl = "";
      if (profilePicture) {
        profilePictureUrl = await uploadProfilePicture(profilePicture, userId);
      }

      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name: formData.name,
        email: formData.email,
        travelClass: formData.travelClass,
        profilePictureUrl, // Save the profile picture URL
        emailVerified: false, // Track email verification status
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-3">
      <div className="bg-white text-blue-950 rounded-lg shadow-lg w-full max-w-6xl flex flex-col-reverse md:flex-row space-x-3">
        {/* Left Image Section */}
        <div className="md:flex md:w-1/2">
          <img src={flightImage} alt="Flight" className="w-full h-full object-cover rounded-l-lg" />
        </div>
        {/* Right Form Section */}
        <div className="md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Create Account</h2>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
            />

            <select
              name="travelClass"
              value={formData.travelClass}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
            </select>

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-950 text-white p-2 rounded hover:bg-blue-900 disabled:bg-gray-400"
            >
              {uploading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}