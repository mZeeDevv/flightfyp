import React from 'react';
import { FaSearch, FaShieldAlt, FaUsers } from 'react-icons/fa';
import anywhereIcon from '../assets/1.avif';
import travelIcon from '../assets/2.avif';
import trustedIcon from '../assets/3.avif';

export default function About() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto">
        {/* Section heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Why Choose Us</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            We're dedicated to making your travel experience seamless, affordable, and stress-free.
          </p>
        </div>
        
        {/* Feature cards container */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 mt-8">
          
          {/* Feature 1 - Flight Search */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col flex-1 max-w-sm transform hover:-translate-y-2 transition-transform duration-300">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FaSearch className="text-blue-600 text-3xl" />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden mb-6">
              <img 
                src={anywhereIcon} 
                alt="Flight search" 
                className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">One search, all the flights</h3>
            <p className="text-gray-600 flex-grow">
              We aggregate deals from hundreds of airlines and travel sites, finding you the best flight deals and travel hacks so you can choose how to book.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-blue-600 font-medium">Across 500+ airlines worldwide</span>
            </div>
          </div>

          {/* Feature 2 - Travel Anxiety Solution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col flex-1 max-w-sm transform hover:-translate-y-2 transition-transform duration-300">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FaShieldAlt className="text-green-600 text-3xl" />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden mb-6">
              <img 
                src={travelIcon} 
                alt="Travel guarantee" 
                className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Rise above travel anxieties</h3>
            <p className="text-gray-600 flex-grow">
              With our Travel Guarantee, we have your back no matter what happens. From delays to cancellations, we're here to support your journey every step of the way.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-green-600 font-medium">24/7 customer support</span>
            </div>
          </div>

          {/* Feature 3 - Trusted by Millions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col flex-1 max-w-sm transform hover:-translate-y-2 transition-transform duration-300">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <FaUsers className="text-purple-600 text-3xl" />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden mb-6">
              <img 
                src={trustedIcon} 
                alt="Trusted by millions" 
                className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Trusted by millions</h3>
            <p className="text-gray-600 flex-grow">
              Join over 10 million satisfied travelers who have discovered the ease and reliability of booking flights through our platform. Your journey starts with trust.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-purple-600 font-medium">4.8/5 average rating</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg">
            Start Your Journey
          </button>
        </div>
      </div>
    </section>
  );
}
