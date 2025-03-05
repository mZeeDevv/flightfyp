import React, { useState, useEffect } from "react";
import { FaPlane } from "react-icons/fa";
import { Link } from "react-router-dom";
import Spinner from '../Components/Spinner'

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
    <header className="bg-gray-900 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center text-sm md:text-xl">
           <Link className="flex items-center justify-center"to="/">
          <FaPlane className="mr-2" />
          <span className="font-bold md:mx-3 mx-2">Flight Finder</span>
          </Link>
          <nav className="flex md:space-x-6 space-x-3 text-sm">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/flights" className="hover:underline">Flights</Link>
          <Link to="/airports" className="hover:underline">Airports</Link>
          <Link to="/carshire" className="hover:underline">Hire a Car</Link>
          </nav>
        </div>

        {/* Navigation */}
        
          {/* Dropdown Menu */}
          {/* <div className="relative group">
            <button className="hover:underline">Services</button>
            <div className="absolute hidden group-hover:block bg-white text-blue-600 shadow-md rounded-md w-40 mt-2">
              <Link to="/service1" className="block px-4 py-2 hover:bg-gray-200">Service 1</Link>
              <Link to="/service2" className="block px-4 py-2 hover:bg-gray-200">Service 2</Link>
              <Link to="/service3" className="block px-4 py-2 hover:bg-gray-200">Service 3</Link>
            </div>
          </div> */}
        

        {/* Login/Profile Buttons */}
        <div>
          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <Link to="/profile" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-200">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
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
