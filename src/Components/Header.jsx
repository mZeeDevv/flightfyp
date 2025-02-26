import React, { useState, useEffect } from "react";
import { FaPlane } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userId"));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("userId"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
  };

  return (
    <header className="bg-blue-950 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center text-xl font-bold">
          <FaPlane className="mr-2" />
          <span>Flight Finder</span>
        </div>

        {/* Navigation */}
        <nav className="flex space-x-6">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/flights" className="hover:underline">Flights</Link>

          {/* Dropdown Menu */}
          <div className="relative group">
            <button className="hover:underline">Services</button>
            <div className="absolute hidden group-hover:block bg-white text-blue-600 shadow-md rounded-md w-40 mt-2">
              <Link to="/service1" className="block px-4 py-2 hover:bg-gray-200">Service 1</Link>
              <Link to="/service2" className="block px-4 py-2 hover:bg-gray-200">Service 2</Link>
              <Link to="/service3" className="block px-4 py-2 hover:bg-gray-200">Service 3</Link>
            </div>
          </div>
        </nav>

        {/* Login/Profile Buttons */}
        <div>
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-200">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/signup" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-200">
              Signup
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
