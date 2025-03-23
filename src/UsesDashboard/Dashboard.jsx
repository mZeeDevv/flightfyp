import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db} from "../firebase"; 
import { signOut, getAuth } from "firebase/auth"; 
import { useNavigate } from "react-router-dom"; 

export default function DashboardData({ userId, children }) {
  const [dashboardData, setDashboardData] = useState({
    flights: 0,
    hotels: 0,
    trips: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 
  const auth = getAuth();
  
  const handleLogout = async () => {
    try {
      await signOut(auth); 
      localStorage.removeItem("userId"); 
      navigate("/login"); 
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const flightsQuery = query(
          collection(db, "user_flights"),
          where("userId", "==", userId)
        );
        const flightsSnapshot = await getDocs(flightsQuery);
        const flightsCount = flightsSnapshot.size;

        const hotelsQuery = query(
          collection(db, "user_hotels"),
          where("userId", "==", userId)
        );
        const hotelsSnapshot = await getDocs(hotelsQuery);
        const hotelsCount = hotelsSnapshot.size;

        // Fetch total trips from user_trip_bookings
        const tripsQuery = query(
          collection(db, "user_trip_bookings"),
          where("userId", "==", userId)
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        const tripsCount = tripsSnapshot.size;

        // Update dashboard data
        setDashboardData({
          flights: flightsCount,
          hotels: hotelsCount,
          trips: tripsCount,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return children({
    dashboardData,
    loading,
    handleLogout,
  });
}