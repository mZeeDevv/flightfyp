import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaUsers, FaPlane, FaHotel, FaComments, FaCog, FaSignOutAlt, FaBook, FaChartBar, FaHeadset } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminSidebar({ currentPath }) {
  const navigate = useNavigate();
  const auth = getAuth();

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminId');
      navigate('/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const adminMenuItems = [
    { path: '/admin', name: 'Dashboard', icon: <FaChartLine /> },
    // { path: '/admin/users', name: 'User Management', icon: <FaUsers /> },
    // { path: '/admin/flights', name: 'Flight Management', icon: <FaPlane /> },
    // { path: '/admin/hotels', name: 'Hotel Management', icon: <FaHotel /> },
    { path: '/admin/feedback', name: 'Feedback', icon: <FaComments /> },
    { path: '/admin/newletter', name: 'Subscriptions', icon: <FaBook /> },
    { path: '/admin/reports', name: 'Reports', icon: <FaChartBar /> },
    { path: '/admin/chat', name: 'Live Chat', icon: <FaHeadset /> },
    { path: '/admin/settings', name: 'Settings', icon: <FaCog /> },
  ];

  return (
    <div className="h-full bg-gray-800 text-white shadow-lg flex flex-col justify-between">
      <div>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <nav>
            {adminMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  currentPath === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
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
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 w-full text-gray-300 hover:bg-red-700 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
