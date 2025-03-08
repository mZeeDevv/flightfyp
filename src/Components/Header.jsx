import React, { useState, useEffect } from "react";
import { FaPlane } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png'
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
        <div className="flex items-center md:text-xl justify-center">
           <Link className="flex items-center justify-center"to="/">
         <img src={logo} alt="logo" width={100} />
          </Link>
          <nav className="flex md:space-x-6 space-x-3 ml-3">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/flights" className="hover:underline">Flights</Link>
          <Link to="/airports" className="hover:underline">Airports</Link>
          <Link to="/carshire" className="hover:underline">Hire a Car</Link>
          </nav>
        </div>        

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
