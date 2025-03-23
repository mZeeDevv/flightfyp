import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function Admin() {
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    feedback: 0
  });
  const [loading, setLoading] = useState(true);

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

    fetchDashboardStats();
  }, []);
  
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
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <p className="text-gray-500">No recent activity to display</p>
              {/* Add recent activity components here */}
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