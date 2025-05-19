import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
// Remove Firebase storage imports
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

  // Cloudinary upload function using signed upload
  const uploadToCloudinary = async (file, userId) => {
    if (!file) return null;
    
    const cloudName = import.meta.env.VITE_CLOUDNAME;
    const apiKey = import.meta.env.VITE_API_KEY_C;
    const apiSecret = import.meta.env.VITE_API_KEY_SECRET_C;
    
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("folder", `user_profiles/${userId}`);
      
      // For signed uploads, we need to generate a signature
      // Note: In production, signature should be generated on the server
      const generateSignature = async (params) => {
        const crypto = await import('crypto-js');
        const stringToSign = Object.keys(params)
          .sort()
          .map(key => `${key}=${params[key]}`)
          .join('&');
        
        return crypto.SHA1(stringToSign + apiSecret).toString();
      };
      
      const signature = await generateSignature({
        timestamp: timestamp,
        folder: `user_profiles/${userId}`,
      });
      
      formData.append("signature", signature);
      
      console.log("Uploading to Cloudinary with cloud name:", cloudName);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("Cloudinary error details:", data);
        throw new Error(`Cloudinary upload failed: ${data.error.message}`);
      }
      
      console.log("Cloudinary upload successful:", data);
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      toast.error("Failed to upload profile picture");
      throw error;
    }
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
      
      // Upload profile picture to Cloudinary first
      let profilePictureUrl = "";
      if (profilePicture) {
        try {
          // Generate a temporary ID for folder structure since we don't have userId yet
          const tempId = Date.now().toString();
          profilePictureUrl = await uploadToCloudinary(profilePicture, tempId);
          console.log("Profile picture uploaded successfully to Cloudinary!");
          console.log("Image URL:", profilePictureUrl);
          console.log("Image location in Cloudinary:", `user_profiles/${tempId}`);
          
          if (!profilePictureUrl) {
            throw new Error("Failed to upload profile picture");
          }
        } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
          toast.error("Failed to upload profile picture. Please try again.");
          setUploading(false);
          return; // Exit early if image upload fails
        }
      }
      
      // Create user in Firebase Auth only if image upload succeeded (or no image was selected)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const userId = user.uid;

      // Send email verification link
      await sendEmailVerification(user);

      // Create user document in Firestore
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name: formData.name,
        email: formData.email,
        travelClass: formData.travelClass,
        profilePictureUrl, 
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Account created successfully! Please verify your email.");
      navigate("/login");
      
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
      toast.error("Failed to create account. Please try again.");
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
            </select>            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                
                {/* Image Preview */}
                {profilePicture && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(profilePicture)} 
                      alt="Profile Preview" 
                      className="w-24 h-24 object-cover rounded-full border-2 border-blue-950"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profilePicture.name} ({Math.round(profilePicture.size / 1024)} KB)
                    </p>
                  </div>
                )}
              </div>
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