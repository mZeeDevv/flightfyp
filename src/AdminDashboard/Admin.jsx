import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";

export default function Admin() {
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    feedback: 0
  });
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch user count
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersCount = usersSnapshot.size;
        
        // Fetch bookings count
        const bookingsRef = collection(db, "user_flights");
        const bookingsSnapshot = await getDocs(bookingsRef);
        const bookingsCount = bookingsSnapshot.size;
        
        // Fetch feedback count
        const feedbackRef = collection(db, "feedback");
        const feedbackSnapshot = await getDocs(feedbackRef);
        const feedbackCount = feedbackSnapshot.size;
        
        setStats({
          users: usersCount,
          bookings: bookingsCount,
          feedback: feedbackCount
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const users = {};
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          users[doc.id] = userData.name || userData.displayName || userData.email || "Unknown User";
        });
        
        setUserMap(users);
        return users;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return {};
      }
    };

    const fetchUserActivityLogs = async (users) => {
      setLogsLoading(true);
      try {
        const logsRef = collection(db, "user_activity_logs");
        const logsQuery = query(logsRef, orderBy("timestamp", "desc"), limit(10));
        const logsSnapshot = await getDocs(logsQuery);
        
        const logs = [];
        logsSnapshot.forEach(doc => {
          logs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // If any logs have a userId that isn't in our userMap, try to fetch those users individually
        const missingUserIds = logs
          .map(log => log.userId || log.user)
          .filter(userId => userId && !users[userId]);
          
        // Remove duplicates
        const uniqueMissingUserIds = [...new Set(missingUserIds)];
        
        // Fetch missing users if any
        for (const userId of uniqueMissingUserIds) {
          try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              users[userId] = userData.name || userData.displayName || userData.email || "Unknown User";
            }
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
          }
        }
        
        setUserMap(users);
        setActivityLogs(logs);
      } catch (error) {
        console.error("Error fetching user activity logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };

    const initData = async () => {
      fetchDashboardStats();
      const users = await fetchUserData();
      fetchUserActivityLogs(users);
    };

    initData();
  }, []);
  
  // Function to get user name from ID
  const getUserName = (userId) => {
    if (!userId) return "Unknown User";
    return userMap[userId] || "Unknown User";
  };
  
  // Function to format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium">Total Users</h3>
                <p className="text-2xl font-bold">{stats.users}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium">Total Bookings</h3>
                <p className="text-2xl font-bold">{stats.bookings}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium">Total Feedback</h3>
                <p className="text-2xl font-bold">{stats.feedback}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent User Activity</h2>
              {logsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-gray-500">No recent activity found</p>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {getUserName(log.userId || log.user)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{log.activity || log.action || 'Unknown action'} {log.activityType}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(log.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Server Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}