import React, { useState, useEffect } from 'react';
import { fetchActivityLogs } from '../../services/LoggingService';
import { format } from 'date-fns';
import { FaPlane, FaHotel, FaSuitcase, FaUser, FaCalendarAlt, FaClock } from 'react-icons/fa';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const getLogs = async () => {
      try {
        setLoading(true);
        const activityLogs = await fetchActivityLogs();
        setLogs(activityLogs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getLogs();
  }, []);
  
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.activityType === filter);
  
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">User Activity Logs</h2>
        
        {/* Filter buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('flight')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'flight' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaPlane className="mr-1" /> Flights
          </button>
          <button 
            onClick={() => setFilter('hotel')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'hotel' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaHotel className="mr-1" /> Hotels
          </button>
          <button 
            onClick={() => setFilter('trip')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'trip' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaSuitcase className="mr-1" /> Trips
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filter === 'all' 
            ? 'No user activity logs found.' 
            : `No ${filter} activity logs found.`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                        {getActivityIcon(log.activityType)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {log.activityType}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{log.userName}</div>
                    <div className="text-xs text-gray-500">{log.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {log.activityType === 'flight' && (
                        <div>
                          <span className="font-medium">Flight:</span> {log.details.from} to {log.details.to}
                          {log.details.flightNumber && (
                            <div className="text-xs text-gray-500">
                              Flight #: {log.details.flightNumber}
                            </div>
                          )}
                          {log.details.price && (
                            <div className="text-xs text-gray-500">
                              Price: RS. {log.details.price}
                            </div>
                          )}
                        </div>
                      )}
                      {log.activityType === 'hotel' && (
                        <div>
                          <span className="font-medium">Hotel:</span> {log.details.hotelName}
                          <div className="text-xs text-gray-500">
                            {log.details.checkInDate} to {log.details.checkOutDate} ({log.details.daysOfStay} nights)
                          </div>
                          {log.details.amount && (
                            <div className="text-xs text-gray-500">
                              Amount: RS. {log.details.amount}
                            </div>
                          )}
                        </div>
                      )}
                      {log.activityType === 'trip' && (
                        <div>
                          <span className="font-medium">Trip:</span> {log.details.destination}
                          <div className="text-xs text-gray-500">
                            {log.details.startDate} to {log.details.endDate}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaCalendarAlt className="mr-1" />
                      {format(new Date(log.timestamp), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <FaClock className="mr-1" />
                      {format(new Date(log.timestamp), 'h:mm a')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
