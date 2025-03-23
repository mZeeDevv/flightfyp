import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaPlane, FaCar, FaHotel, FaComments, FaCog, FaSignOutAlt, FaSuitcase } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth'; // Firebase logout
import { useNavigate } from 'react-router-dom'; // For navigation after logout
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Firestore imports
import {db} from '../firebase';
export default function Sidebar({ currentPath }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        try {
         
          const adminDoc = await getDoc(doc(db, "admins", auth.currentUser.uid));
                    setIsAdmin(adminDoc.exists());
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [auth.currentUser]);

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      localStorage.removeItem('userId'); // Remove userId from local storage
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const menuItems = [
    { path: '/profile', name: 'Profile', icon: <FaUser /> },
    { path: '/my-flights', name: 'My Flights', icon: <FaPlane /> },
    // { path: '/my-cars', name: 'My Cars', icon: <FaCar /> },
    { path: '/my-hotels', name: 'My Hotels', icon: <FaHotel /> },
    { path: '/my-trips', name: 'My Trips', icon: <FaSuitcase /> }, 
    { path: '/my-fav-trips', name: 'Favourite Trips', icon: <FaComments /> },
    { path: '/feedback', name: 'Feedback', icon: <FaComments /> },
  ];

  // Add admin link only if user is admin
  if (isAdmin) {
    menuItems.push({ path: '/admin', name: 'Admin Dashboard', icon: <FaCog /> });
  }

  return (
    <div className="h-full bg-white shadow-lg flex flex-col justify-between">
      <div>
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <nav>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  currentPath === item.path
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 w-full text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}