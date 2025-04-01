import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SubscriptionsList from './SubscriptionsList';
import ActivityLogs from './ActivityLogs';
import { fetchRecentActivityLogs } from '../../services/LoggingService';
import { format } from 'date-fns';
import { FaPlane, FaHotel, FaSuitcase, FaUser, FaClock } from 'react-icons/fa';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const location = useLocation();
  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true);

  // Check for tab parameter in URL when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'activity') {
      setActiveTab('activity');
    }
  }, [location]);
  
  // Fetch recent activity logs
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoadingRecentActivity(true);
        const logs = await fetchRecentActivityLogs(5); // Get 5 most recent logs
        setRecentLogs(logs);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoadingRecentActivity(false);
      }
    };
    
    fetchRecentActivity();
  }, []);
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'flight':
        return <FaPlane className="text-blue-500" />;
      case 'hotel':
        return <FaHotel className="text-green-500" />;
      case 'trip':
        return <FaSuitcase className="text-purple-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your application data</p>
      </div>
      
      {/* Recent Activity Section */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
          <button 
            onClick={() => setActiveTab('activity')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>
        
        {loadingRecentActivity ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity found.</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                  {getActivityIcon(log.activityType)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{log.userName}</span> {log.action} a {log.activityType}
                    {log.activityType === 'flight' && (
                      <span> from <span className="font-medium">{log.details.from}</span> to <span className="font-medium">{log.details.to}</span></span>
                    )}
                    {log.activityType === 'hotel' && (
                      <span> at <span className="font-medium">{log.details.hotelName}</span></span>
                    )}
                    {log.activityType === 'trip' && (
                      <span> to <span className="font-medium">{log.details.destination}</span></span>
                    )}
                  </p>
                </div>
                <div className="ml-2 flex items-center text-xs text-gray-500">
                  <FaClock className="mr-1" />
                  {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            User Activity
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <SubscriptionsList />
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow-md">
            <ActivityLogs />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
