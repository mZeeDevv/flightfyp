import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { FaPlane, FaArrowRight, FaClock, FaMoneyBillWave } from 'react-icons/fa';

// Use the same API constants as in Flights.jsx
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";
const USD_TO_PKR_RATE = 280; // Conversion rate: 1 USD = 280 PKR

// Utility function to convert USD to PKR
const convertUsdToPkr = (usdAmount) => {
  if (!usdAmount || isNaN(usdAmount)) return "N/A";
  return Math.round(usdAmount * USD_TO_PKR_RATE);
};

export default function FlightRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) {
          // User is not logged in - don't show any recommendations
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // 1. Fetch user profile
        const userSnap = await getDocs(query(
          collection(db, "users"),
          where("uid", "==", userId)
        ));
        
        if (!userSnap.empty) {
          const profile = userSnap.docs[0].data();
          setUserProfile(profile);
        }

        // 2. Fetch user's flights from user_flights table
        const userFlightsSnap = await getDocs(query(
          collection(db, "user_flights"),
          where("userId", "==", userId),
          orderBy("flightDetails.departureTime", "desc"),
          limit(10)
        ));
        
        // 3. Process each flight document
        const userFlights = [];
        userFlightsSnap.forEach(doc => {
          const flightData = doc.data();
          const flightDetails = flightData.flightDetails || {};
          
          userFlights.push({
            id: doc.id,
            departure: flightDetails.departure || 'Unknown',
            arrival: flightDetails.arrival || 'Unknown',
            airline: flightDetails.airline || 'Unknown Airline',
          });
        });
        
        if (userFlights.length === 0) {
          // User is logged in but has no flight history
          setRecommendations([]);
          setLoading(false);
          return;
        }
        
        // 4. Get up to 3 unique flight routes (based on departure-arrival pairs)
        const uniqueRoutes = [];
        const routeMap = new Map();
        
        userFlights.forEach(flight => {
          const routeKey = `${flight.departure}-${flight.arrival}`;
          if (!routeMap.has(routeKey) && uniqueRoutes.length < 3) {
            routeMap.set(routeKey, true);
            uniqueRoutes.push(flight);
          }
        });
        
        console.log("Unique flight routes found:", uniqueRoutes);
        
        // 5. Process each unique route to get three recommendations per route
        let allRecommendations = [];
        
        for (const pastFlight of uniqueRoutes) {
          try {
            // 6. Get a future date 5-6 days from today for recommendations
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5 + Math.floor(Math.random() * 2));
            const futureDateStr = futureDate.toISOString().split('T')[0];
            
            // 7. Get airport IDs using the same approach as in Home.jsx
            const fromId = await fetchAirportId(pastFlight.departure);
            const toId = await fetchAirportId(pastFlight.arrival);
            
            console.log(`Search for route ${pastFlight.departure} to ${pastFlight.arrival}:`, {
              fromId,
              toId,
              departureDate: futureDateStr
            });
            
            if (!fromId || !toId) {
              console.log(`Skipping route ${pastFlight.departure} to ${pastFlight.arrival} - could not find airport IDs`);
              continue;
            }
              // 8. Use the airport IDs to search for flights - use USD since API doesn't support PKR
            const url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${futureDateStr}&currency_code=USD&cabinClass=ECONOMY`;
            
            const options = {
              method: "GET",
              headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": API_HOST,
              }
            };
            
            const response = await fetch(url, options);
            if (!response.ok) {
              throw new Error(`API response error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`Found ${result.data?.flightOffers?.length || 0} flight offers for route ${pastFlight.departure} to ${pastFlight.arrival}`);
            
            if (result.status === true && result.data?.flightOffers?.length > 0) {
              // 9. Get the first 3 flight offers for this route (or all if less than 3)
              const offersToShow = Math.min(2, result.data.flightOffers.length);
              const routeRecommendations = [];
              
              for (let i = 0; i < offersToShow; i++) {
                const offer = result.data.flightOffers[i];
                  const departureAirport = offer.segments?.[0]?.departureAirport;
                const arrivalAirport = offer.segments?.[0]?.arrivalAirport;
                const departureTime = offer.segments?.[0]?.departureTime;
                const arrivalTime = offer.segments?.[0]?.arrivalTime;
                
                // Get price in USD and convert to PKR
                const priceUsd = offer.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
                
                // Calculate duration in minutes
                const duration = new Date(arrivalTime).getTime() - new Date(departureTime).getTime();
                const durationMinutes = Math.floor(duration / (1000 * 60));
                
                // Get airline info
                const marketingAirline = offer.segments?.[0]?.marketingAirline;
                const airlineName = marketingAirline?.name || 
                                   offer.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.name || 
                                   "Unknown Airline";
                const airlineLogo = marketingAirline?.logoUrl || 
                                   offer.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.logo || 
                                   null;
                
                // 10. Create a recommendation for this route
                const recommendation = {
                  id: offer.token || `rec-${pastFlight.departure}-${pastFlight.arrival}-${i}`,
                  token: offer.token,
                  departure: departureAirport?.code || pastFlight.departure,
                  arrival: arrivalAirport?.code || pastFlight.arrival,
                  departureTime: departureTime,
                  arrivalTime: arrivalTime,                  flightNumber: offer.segments?.[0]?.flightNumber || 
                               offer.segments?.[0]?.legs?.[0]?.flightNumber || 
                               "N/A",
                  amount: priceUsd, // Store USD amount
                  amountPkr: convertUsdToPkr(priceUsd), // Store converted PKR amount
                  airline: airlineName,
                  airlineLogo: airlineLogo,
                  duration: durationMinutes,
                  stops: offer.segments?.[0]?.legs?.length - 1 || 0
                };
                
                routeRecommendations.push(recommendation);
              }
              
              allRecommendations = [...allRecommendations, ...routeRecommendations];
            }
          } catch (routeError) {
            console.error(`Error processing route:`, routeError);
            // Continue to the next route on error
          }
        }
        
        // 11. Set recommendations in state
        setRecommendations(allRecommendations);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load recommendations. Please try again later.");
        setLoading(false);
      }
    };

    // Fetch airport ID for a city - using same approach as Home.jsx
    const fetchAirportId = async (city) => {
      if (!city) return null;

      const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(city)}`;
      const options = {
          method: "GET",
          headers: {
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": API_HOST,
          },
      };

      try {
          const response = await fetch(url, options);
          const result = await response.json();

          if (result?.data?.length > 0) {
              console.log(`Found airport ID for "${city}": ${result.data[0].id}`);
              return result.data[0].id;
          } else {
              // Try to extract a city name from the full airport name
              const cityMatch = city.match(/^(.*?)\s+(?:International\s+)?Airport/i);
              if (cityMatch && cityMatch[1]) {
                  const extractedCity = cityMatch[1].trim();
                  console.log(`Trying with extracted city name: "${extractedCity}"`);
                  
                  const secondUrl = `https://${API_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(extractedCity)}`;
                  const secondResponse = await fetch(secondUrl, options);
                  const secondResult = await secondResponse.json();
                  
                  if (secondResult?.data?.length > 0) {
                      console.log(`Found airport ID for extracted city "${extractedCity}": ${secondResult.data[0].id}`);
                      return secondResult.data[0].id;
                  }
              }
              
              console.log(`No airport ID found for "${city}"`);
              return null;
          }
      } catch (error) {
          console.error(`Error fetching airport ID for "${city}":`, error);
          return null;
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
              ? `${userProfile.name.split(' ')[0]}, Here Are Some Affordable Flights for You`
              : userId 
                ? 'Recommended Flights Based on Your History' 
                : 'Flight Recommendations'}
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
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
              Search for flights instead
            </Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaPlane className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {userId 
                ? "No personalized flight recommendations available based on your history." 
                : "Log in to get personalized flight recommendations based on your travel history."}
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link 
                to="/" 
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search for Flights
              </Link>
              {!userId && (
                <Link 
                  to="/login" 
                  className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Log In
                </Link>
              )}
            </div>
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
                    <div className="flex items-center">                      <FaMoneyBillWave className="text-green-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-xl font-bold text-green-600">RS. {convertUsdToPkr(flight.amount)}</p>
                      </div>
                    </div>
                
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
