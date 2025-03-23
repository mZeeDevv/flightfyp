import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { FaPlane, FaCalendarAlt, FaArrowRight, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import Spinner from './Spinner';

// Use the same API constants as in Flights.jsx
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";

export default function FlightRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId) {
          // Fetch user profile
          const userSnap = await getDocs(query(
            collection(db, "users"),
            where("uid", "==", userId)
          ));
          
          if (!userSnap.empty) {
            const profile = userSnap.docs[0].data();
            setUserProfile(profile);
          }

          // Fetch user's flights from user_flights table
          const userFlightsSnap = await getDocs(query(
            collection(db, "user_flights"),
            where("userId", "==", userId),
            orderBy("flightDetails.departureTime", "desc"),
            limit(10)
          ));
          
          // Process each flight document
          const userFlights = [];
          userFlightsSnap.forEach(doc => {
            const flightData = doc.data();
            const flightDetails = flightData.flightDetails || {};
            
            userFlights.push({
              id: doc.id,
              userId: flightData.userId,
              departure: flightDetails.departure || 'Unknown',
              arrival: flightDetails.arrival || 'Unknown',
              flightNumber: flightDetails.flightNumber || 'N/A',
              airline: flightDetails.airline || 'Unknown Airline',
              departureTime: flightDetails.departureTime,
              arrivalTime: flightDetails.arrivalTime,
              amount: flightDetails.amount || 0,
              token: flightDetails.token || doc.id
            });
          });
          
          if (userFlights.length > 0) {
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // For the first historical flight, fetch new available flights
            const recentFlight = userFlights[0];
            try {
              // Properly encode airport names for the URL (replace spaces with %20)
              const fromId = encodeURIComponent(recentFlight.departure);
              const toId = encodeURIComponent(recentFlight.arrival);
              
              // Use the correct API endpoint from Flights.jsx with encoded parameters
              const url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${today}&currency_code=INR&cabinClass=ECONOMY`;
              console.log("Encoded API URL:", url);
              
              const options = {
                method: "GET",
                headers: {
                  "x-rapidapi-key": RAPIDAPI_KEY,
                  "x-rapidapi-host": API_HOST,
                }
              };
              
              const response = await fetch(url, options);
              const result = await response.json();
              console.log("API Response:", result);
              
              if (result.status === true && result.data?.flightOffers?.length > 0) {
                // Process the flight offers matching the structure from Flights.jsx
                const flightRecommendations = result.data.flightOffers.slice(0, 3).map((offer, index) => {
                  const departureAirport = offer.segments?.[0]?.departureAirport;
                  const arrivalAirport = offer.segments?.[0]?.arrivalAirport;
                  const departureTime = offer.segments?.[0]?.departureTime;
                  const arrivalTime = offer.segments?.[0]?.arrivalTime;
                  const price = offer.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
                  
                  // Calculate duration in minutes
                  const duration = new Date(arrivalTime).getTime() - new Date(departureTime).getTime();
                  const durationMinutes = Math.floor(duration / (1000 * 60));
                  
                  return {
                    id: offer.token || `rec-${index}`,
                    token: offer.token,
                    departure: departureAirport?.code || recentFlight.departure,
                    arrival: arrivalAirport?.code || recentFlight.arrival,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    flightNumber: offer.segments?.[0]?.flightNumber || "N/A",
                    amount: price,
                    airline: offer.segments?.[0]?.marketingAirline?.name || "Unknown Airline",
                    airlineLogo: offer.segments?.[0]?.marketingAirline?.logoUrl,
                    duration: durationMinutes,
                    stops: offer.segments?.[0]?.legs?.length - 1 || 0
                  };
                });
                
                setRecommendations(flightRecommendations);
              } else {
                // Fallback to user's flight history if API doesn't return expected data
                setRecommendations(userFlights.slice(0, 3));
              }
            } catch (apiError) {
              console.error("API Error:", apiError);
              // Fallback to user's flight history
              setRecommendations(userFlights.slice(0, 3));
            }
          } else {
            // Fallback recommendations
            setRecommendations([
              {
                id: "demo1",
                token: "demo1",
                departure: "KHI",
                arrival: "ISB",
                departureTime: new Date().toISOString(),
                arrivalTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                flightNumber: "PK300",
                amount: 25000,
                airline: "PIA",
                airlineLogo: "https://logos.skyscnr.com/images/airlines/favicon/PK.png",
                duration: 120,
                stops: 0
              },
              {
                id: "demo2",
                token: "demo2",
                departure: "LHE",
                arrival: "DXB",
                departureTime: new Date().toISOString(),
                arrivalTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(),
                flightNumber: "EK625",
                amount: 65000,
                airline: "Emirates",
                airlineLogo: "https://logos.skyscnr.com/images/airlines/favicon/EK.png",
                duration: 180,
                stops: 0
              }
            ]);
          }
        } else {
          // Demo recommendations for non-logged in users
          setRecommendations([
            {
              id: "demo1",
              token: "demo1",
              departure: "KHI",
              arrival: "ISB",
              departureTime: new Date().toISOString(),
              arrivalTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
              flightNumber: "PK300",
              amount: 25000,
              airline: "PIA",
              airlineLogo: "https://logos.skyscnr.com/images/airlines/favicon/PK.png",
              duration: 120,
              stops: 0
            }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load recommendations. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {userProfile?.name 
              ? `Flights You Might Like, ${userProfile.name.split(' ')[0]}`
              : userId 
                ? 'Recommended Flights Based on Your History' 
                : 'Popular Flight Deals'}
          </h2>
          <Link to="/search" className="text-blue-600 hover:text-blue-800 flex items-center">
            View all flights <FaArrowRight className="ml-1" />
          </Link>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <FaPlane className="text-blue-500 text-3xl animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-full bg-white/50 rounded-full animate-ping"></div>
              </div>
              <p className="mt-4 text-lg text-gray-600">Loading flight recommendations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Link to="/search" className="mt-4 inline-block text-blue-600 hover:underline">
              Search for flights instead
            </Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaPlane className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No flight recommendations available at the moment.</p>
            <Link to="/search" className="mt-4 ml-4 inline-block text-blue-600 hover:underline">
              Search for flights
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((flight) => (
              <Link 
                key={flight.id} 
                to={`/flight-details`}
                state={{ token: flight.token }}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:transform hover:scale-105 hover:shadow-lg"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        src={flight.airlineLogo || `https://source.unsplash.com/featured/?airline,${flight.airline}`} 
                        alt={flight.airline}
                        className="w-8 h-8 object-contain mr-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://source.unsplash.com/featured/?airplane`;
                        }}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{flight.airline}</p>
                        <p className="text-xs text-gray-500">{flight.flightNumber}</p>
                      </div>
                    </div>
                    <div>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{formatTime(flight.departureTime)}</p>
                      <p className="text-sm font-medium">{flight.departure}</p>
                      <p className="text-xs text-gray-500">{formatDate(flight.departureTime)}</p>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-500 mb-1 flex items-center">
                        <FaClock className="mr-1" />
                        {formatDuration(flight.duration)}
                      </div>
                      <div className="w-20 h-0.5 bg-gray-300 relative">
                        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -top-0.75 -right-1"></div>
                      </div>
                      <FaPlane className="text-blue-500 mt-1 transform rotate-90" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{formatTime(flight.arrivalTime)}</p>
                      <p className="text-sm font-medium">{flight.arrival}</p>
                      <p className="text-xs text-gray-500">{formatDate(flight.arrivalTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center">
                      <FaMoneyBillWave className="text-green-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-xl font-bold text-green-600">RS. {flight.amount}</p>
                      </div>
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
