import React, { useState, useEffect } from "react";
import { FaPlane, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userId"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-gray-900 to-blue-900 text-white shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link className="flex items-center hover:opacity-80 transition-opacity duration-200" to="/">
            <img src={logo} alt="logo" className="w-24 md:w-32" />
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-2xl focus:outline-none" 
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation - desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="hover:text-blue-300 transition-colors duration-200 font-medium">Home</Link>
          <Link to="/airports" className="hover:text-blue-300 transition-colors duration-200 font-medium">Airports</Link>
          <Link to="/carshire" className="hover:text-blue-300 transition-colors duration-200 font-medium">Hire a Car</Link>
          
          {/* Login/Profile Buttons */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-4 ml-4">
              <Link to="/profile" className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 shadow-md font-medium">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 shadow-md font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/signup" className="bg-white text-blue-700 px-5 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 shadow-md font-medium ml-4">
              Sign up
            </Link>
          )}
        </nav>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-gradient-to-r from-gray-900 to-blue-900 p-4 md:hidden flex flex-col space-y-4 shadow-lg">
            <Link to="/" className="hover:text-blue-300 transition-colors duration-200 font-medium px-2 py-1" onClick={toggleMobileMenu}>Home</Link>
            <Link to="/airports" className="hover:text-blue-300 transition-colors duration-200 font-medium px-2 py-1" onClick={toggleMobileMenu}>Airports</Link>
            <Link to="/carshire" className="hover:text-blue-300 transition-colors duration-200 font-medium px-2 py-1" onClick={toggleMobileMenu}>Hire a Car</Link>
            
            {isLoggedIn ? (
              <div className="flex flex-col space-y-2">
                <Link to="/profile" className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 shadow-md font-medium text-center" onClick={toggleMobileMenu}>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 shadow-md font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/signup" className="bg-white text-blue-700 px-5 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 shadow-md font-medium text-center" onClick={toggleMobileMenu}>
                Sign up
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
