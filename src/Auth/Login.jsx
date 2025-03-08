import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlane, FaHotel, FaCar, FaUser, FaLock } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Authenticate the user with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Fetch the user document from Firestore based on email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Assuming email is unique, so there's only one document
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        // Save the document ID to localStorage
        localStorage.setItem("userId", userId);
        toast.success("Login successful!");
        navigate("/profile");
      } else {
        toast.error("User not found in database");
      }
    } catch (error) {
      toast.error("Invalid email or password");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* About Us Section */}
      <div className="w-1/2 bg-gray-900 text-white flex flex-col justify-center p-12">
        <h2 className="text-4xl font-bold mb-6">Welcome to JetSeeker</h2>
        <p className="text-lg mb-8">
          Your one-stop solution for booking flights, hotels, and cars. Explore the world with ease and comfort.
        </p>
        <div className="space-y-6">
          <div className="flex items-center">
            <FaPlane className="text-3xl mr-4" />
            <p className="text-lg">Book flights to your dream destinations.</p>
          </div>
          <div className="flex items-center">
            <FaHotel className="text-3xl mr-4" />
            <p className="text-lg">Find the best hotels for your stay.</p>
          </div>
          <div className="flex items-center">
            <FaCar className="text-3xl mr-4" />
            <p className="text-lg">Rent cars for seamless travel.</p>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="w-1/2 flex flex-col justify-center p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white p-3 rounded-lg hover:bg-gray-800 transition duration-300"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}