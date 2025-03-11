import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaPlane, FaCar, FaHotel, FaComments, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth'; // Firebase logout
import { useNavigate } from 'react-router-dom'; // For navigation after logout

export default function Sidebar({ currentPath }) {
  const navigate = useNavigate(); // For navigation
  const auth = getAuth(); // Firebase auth instance

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
    { path: '/my-cars', name: 'My Cars', icon: <FaCar /> },
    { path: '/my-hotels', name: 'My Hotels', icon: <FaHotel /> },
    { path: '/feedback', name: 'Feedback', icon: <FaComments /> },
    { path: '/admin', name: 'Admin Dashboard', icon: <FaCog /> }, // Admin Dashboard link
  ];

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