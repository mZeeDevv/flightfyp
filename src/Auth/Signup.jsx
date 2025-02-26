import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import flightImage from "../assets/flight.png"; // Import the image

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    travelClass: "Economy",
  });

  const auth = getAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate password
  const isPasswordValid = (password) => {
    return password.length >= 6; // You can add more conditions
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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const userId = user.uid; // Get the Firebase user ID

      // Save user data to Firestore with UID as the document ID
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name: formData.name,
        email: formData.email,
        travelClass: formData.travelClass,
      });

      // Save UID in localStorage instead of email
      localStorage.setItem("userId", userId);

      navigate("/profile"); // Redirect after signup
    } catch (error) {
      setError(error.message);
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

            <button
              type="submit"
              className="w-full bg-blue-950 text-white p-2 rounded hover:bg-blue-900"
            >
              Sign Up
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
