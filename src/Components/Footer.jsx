import React from "react";
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin, 
  FaPlane, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaArrowRight,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal
} from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <img src={logo} alt="JetSeeker" className="h-10 mr-3" />
              <h3 className="text-xl font-bold">JetSeeker</h3>
            </div>
            <p className="text-gray-300 mb-4">
              We help travelers find the best flight deals and plan their journeys with ease and confidence.
            </p>
            <div className="flex flex-col space-y-2 text-gray-300">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-400" />
                <span>Islamabad, Pakistan</span>
              </div>
              <div className="flex items-center">
                <FaPhoneAlt className="mr-2 text-blue-400" />
                <span>+92 300 1234567</span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="mr-2 text-blue-400" />
                <span>support@jetseeker.com</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/airports" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Airports
                </Link>
              </li>
              <li>
                <Link to="/carshire" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Car Hire
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/flights" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Flight Booking
                </Link>
              </li>
              <li>
                <Link to="/carshire" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Car Rentals
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-use" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to receive updates on special offers and travel deals!
            </p>
            <form className="flex mb-4">
              <input
                type="email"
                placeholder="Your email address"
                className="p-2 rounded-l-lg flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 px-4 rounded-r-lg"
              >
                <FaArrowRight />
              </button>
            </form>
            
            {/* Social Media */}
            <h4 className="font-semibold text-white mb-2">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-blue-600 p-2 rounded-full transition-colors duration-300"
              >
                <FaFacebook size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-blue-400 p-2 rounded-full transition-colors duration-300"
              >
                <FaTwitter size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-pink-600 p-2 rounded-full transition-colors duration-300"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-blue-700 p-2 rounded-full transition-colors duration-300"
              >
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              We accept the following payment methods:
            </div>
            <div className="flex space-x-4 text-gray-300">
              <FaCcVisa size={28} className="hover:text-blue-400 transition-colors duration-300" />
              <FaCcMastercard size={28} className="hover:text-red-400 transition-colors duration-300" />
              <FaCcAmex size={28} className="hover:text-blue-500 transition-colors duration-300" />
              <FaCcPaypal size={28} className="hover:text-blue-600 transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-gray-900 py-4 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© {currentYear} JetSeeker. All Rights Reserved.</p>
          <p className="text-sm mt-2">
            Designed with <span className="text-red-500">❤</span> for travelers around the world
          </p>
        </div>
      </div>
    </footer>
  );
}
