import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component
import { logUserActivity } from "../services/LoggingService"; // Import logging service

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";
const USD_TO_PKR_RATE = 280; // Conversion rate: 1 USD = 280 PKR

// Utility function to convert USD to PKR
const convertUsdToPkr = (usdAmount) => {
  if (!usdAmount || isNaN(usdAmount)) return "N/A";
  return Math.round(usdAmount * USD_TO_PKR_RATE);
};

export default function Flights() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fromId, toId, departureDate, returnDate, cabinClass } = location.state || {};
  const [flightDeals, setFlightDeals] = useState([]);
  const [flightoffers, setFlightOffers] = useState([]);
  const [airlines, setAirlines] = useState([]); // State for airlines
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Add state for the sidebar
  const [showFlightDetailsSidebar, setShowFlightDetailsSidebar] = useState(false);
  const [flightDetailsToken, setFlightDetailsToken] = useState(null);
  const [flightDetailsData, setFlightDetailsData] = useState(null);
  const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);
  const [flightDetailsError, setFlightDetailsError] = useState("");

  // Add sorting state
  const [sortOption, setSortOption] = useState("recommended");
  const [sortedFlights, setSortedFlights] = useState([]);
  // Function to handle viewing flight details in sidebar
  const handleViewFlightDetails = (token) => {
    setFlightDetailsToken(token);
    setShowFlightDetailsSidebar(true);
    fetchFlightDetails(token);
  };
  
  // Function to fetch flight details
  const fetchFlightDetails = async (token) => {
    if (!token) return;
    
    setLoadingFlightDetails(true);
    setFlightDetailsError("");
    setFlightDetailsData(null);
    
    // Keep using USD currency in API calls since PKR is not supported
    const url = `https://${API_HOST}/api/v1/flights/getFlightDetails?token=${token}&currency_code=USD`;
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
      console.log("Flight Details API Response:", result);
      
      if (result.status === true && result.data) {
        setFlightDetailsData(result.data);
      } else {
        setFlightDetailsError("No flight details found.");
      }
    } catch (error) {
      console.error("Error fetching flight details:", error);
      setFlightDetailsError("Failed to fetch flight details. Please try again later.");
    } finally {
      setLoadingFlightDetails(false);
    }
  };
  
  // Function to close the sidebar
  const closeFlightDetailsSidebar = () => {
    setShowFlightDetailsSidebar(false);
  };
  // Function to handle proceed to payment
  const handlePaymentClick = () => {
    if (!flightDetailsData) return;

    // Get price in USD and PKR
    const usdPrice = flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 'N/A';
    const pkrPrice = convertUsdToPkr(usdPrice);
    
    // Log the flight booking activity
    const flightDetails = {
      from: flightDetailsData.segments?.[0]?.departureAirport?.name || 'N/A',
      to: flightDetailsData.segments?.[0]?.arrivalAirport?.name || 'N/A',
      departureTime: flightDetailsData.segments?.[0]?.departureTime || 'N/A',
      arrivalTime: flightDetailsData.segments?.[0]?.arrivalTime || 'N/A',
      flightNumber: flightDetailsData.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
      price: pkrPrice // Send the PKR price for logging
    };
    
    logUserActivity('booked', 'flight', flightDetails);
    
    navigate('/payment', { 
      state: { 
        amount: pkrPrice, // Send PKR amount to payment page
        amountUsd: usdPrice, // Also send USD amount in case it's needed
        flightNumber: flightDetailsData.segments?.[0]?.legs?.[0]?.flightNumber,
        token: flightDetailsToken,
        apiKey: RAPIDAPI_KEY
      } 
    });
  };
  
  useEffect(() => {
    const fetchFlights = async () => {
      if (!fromId || !toId || !departureDate) {
        setError("Missing required search parameters.");
        return;
      }      let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=USD`;
      if (returnDate) url += `&returnDate=${returnDate}`;
      if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": API_HOST,
        },
      };

      try {
        setLoading(true);
        setError("");
        const response = await fetch(url, options);
        const result = await response.json();
        console.log("API Response:", result);

        if (result.status === true && result.data?.flightDeals?.length > 0) {
          setFlightDeals(result.data.flightDeals);
          setFlightOffers(result.data.flightOffers);
          setAirlines(result.data.aggregation?.airlines || []); // Set airlines data
        } else {
          setError("No flight deals found.");
          setFlightDeals([]);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
        setError("Failed to fetch flight data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [fromId, toId, departureDate, returnDate, cabinClass]);

  // Apply sorting whenever flight offers or sort option changes
  useEffect(() => {
    if (flightoffers.length > 0) {
      const taggedOffers = assignTags(flightoffers);
      const sorted = sortFlights(taggedOffers, sortOption);
      setSortedFlights(sorted);
    } else {
      setSortedFlights([]);
    }
  }, [flightoffers, sortOption]);

  // Function to calculate flight duration
  const calculateDuration = (departureTime, arrivalTime) => {
    const depTime = new Date(departureTime).getTime();
    const arrTime = new Date(arrivalTime).getTime();
    return (arrTime - depTime) / (1000 * 60); // Duration in minutes
  };

  // Function to assign tags to flights
  const assignTags = (flights) => {
    if (flights.length === 0) return flights;
  
    // Helper function to normalize values between 0 and 1
    const normalize = (value, min, max) => (value - min) / (max - min);
  
    // Extract prices, durations, and number of legs
    const prices = flights.map(
      (flight) => flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity
    );
    const durations = flights.map((flight) =>
      calculateDuration(flight.segments?.[0]?.departureTime, flight.segments?.[0]?.arrivalTime)
    );
    const legs = flights.map((flight) => flight.segments?.[0]?.legs?.length || 1);
  
    // Find min and max for normalization
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
  
    // Assign tags
    return flights.map((flight, index) => {
      const tags = [];
      const price = prices[index];
      const duration = durations[index];
      const numLegs = legs[index];
  
      // Cheapest
      if (price === minPrice) {
        tags.push("Cheapest");
      }
  
      // Fastest
      if (duration === minDuration) {
        tags.push("Fastest");
      }
  
      // Best (based on a weighted score)
      const normalizedPrice = normalize(price, minPrice, maxPrice);
      const normalizedDuration = normalize(duration, minDuration, maxDuration);
      const score = 0.6 * normalizedPrice + 0.4 * normalizedDuration;
  
      // Assign "Best" tag to the flight with the lowest score
      if (score === Math.min(...flights.map((f, i) => 0.6 * normalize(prices[i], minPrice, maxPrice) + 0.4 * normalize(durations[i], minDuration, maxDuration)))) {
        tags.push("Best");
      }
      if (numLegs > 1) {
        tags.push("Multi-Stop");
      }
  
      return { ...flight, tags };
    });
  };

  // Function to sort flights based on different criteria
  const sortFlights = (flights, option) => {
    if (!flights || flights.length === 0) return [];
    
    const flightsCopy = [...flights];
    
    switch (option) {
      case "price-low":
        return flightsCopy.sort((a, b) => {
          const priceA = a.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
          const priceB = b.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
          return priceA - priceB;
        });
      
      case "price-high":
        return flightsCopy.sort((a, b) => {
          const priceA = a.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
          const priceB = b.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
          return priceB - priceA;
        });
      
      case "duration":
        return flightsCopy.sort((a, b) => {
          const durationA = calculateDuration(a.segments?.[0]?.departureTime, a.segments?.[0]?.arrivalTime);
          const durationB = calculateDuration(b.segments?.[0]?.departureTime, b.segments?.[0]?.arrivalTime);
          return durationA - durationB;
        });
      
      case "departure":
        return flightsCopy.sort((a, b) => {
          const depTimeA = new Date(a.segments?.[0]?.departureTime || 0).getTime();
          const depTimeB = new Date(b.segments?.[0]?.departureTime || 0).getTime();
          return depTimeA - depTimeB;
        });
      
      case "comfort":
        return flightsCopy.sort((a, b) => {
          // Comfort score: fastest gets priority, multi-stop gets penalty
          let scoreA = 0;
          let scoreB = 0;
          
          // Check for multi-stop (lower comfort)
          const legsA = a.segments?.[0]?.legs?.length || 1;
          const legsB = b.segments?.[0]?.legs?.length || 1;
          
          if (legsA > 1) scoreA -= 50;
          if (legsB > 1) scoreB -= 50;
          
          // Check for fastest tag (higher comfort)
          if (a.tags?.includes("Fastest")) scoreA += 30;
          if (b.tags?.includes("Fastest")) scoreB += 30;
          
          // Factor in duration (shorter = more comfortable)
          const durationA = calculateDuration(a.segments?.[0]?.departureTime, a.segments?.[0]?.arrivalTime);
          const durationB = calculateDuration(b.segments?.[0]?.departureTime, b.segments?.[0]?.arrivalTime);
          
          scoreA += (1000 - Math.min(durationA, 1000))/10; // Cap at 1000 min, higher score for shorter flights
          scoreB += (1000 - Math.min(durationB, 1000))/10;
          
          return scoreB - scoreA; // Higher score first
        });
      
      case "recommended":
      default:
        // Default sorting shows best value flights first (using tags)
        return flightsCopy.sort((a, b) => {
          // Priority: Best > Fastest > Cheapest > Others
          const tagPriorityOrder = {"Best": 3, "Fastest": 2, "Cheapest": 1};
          
          const highestTagA = a.tags?.reduce((highest, tag) => 
            (tagPriorityOrder[tag] > tagPriorityOrder[highest] || !highest) ? tag : highest, "");
          const highestTagB = b.tags?.reduce((highest, tag) => 
            (tagPriorityOrder[tag] > tagPriorityOrder[highest] || !highest) ? tag : highest, "");
            
          const priorityA = tagPriorityOrder[highestTagA] || 0;
          const priorityB = tagPriorityOrder[highestTagB] || 0;
          
          return priorityB - priorityA;
        });
    }
  };

  // Handler for sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const taggedFlightOffers = assignTags(flightoffers);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Function to handle "More Information" button click
  const handleMoreInfo = (token) => {
    navigate("/flight-details", { state: { token } });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Available Flight Deals</h1>
      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Flight Deals Section */}
      {flightDeals.length > 0 && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Top Flight Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flightDeals.map((deal, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{deal.key}</p>
                  </div>                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      RS {convertUsdToPkr(deal.price?.units) || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Airlines Section */}
      {airlines.length > 0 && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Airlines Providing Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {airlines.map((airline, index) => (
              <div key={index} className="flex items-center space-x-2">
                <img
                  src={airline.logoUrl}
                  alt={airline.name}
                  className="w-10 h-10 rounded-full"
                />
                <p className="text-gray-700 font-medium">{airline.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flight Offers Section with Sorting Options */}
      {sortedFlights.length > 0 && (
        <div className="w-full p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-2xl font-semibold mb-4 md:mb-0">Flight Offers</h2>
            
            {/* Sorting Options */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSortChange('recommended')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'recommended' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => handleSortChange('price-low')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'price-low' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price (Low to High)
              </button>
              <button
                onClick={() => handleSortChange('price-high')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'price-high' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price (High to Low)
              </button>
              <button
                onClick={() => handleSortChange('duration')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'duration' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Duration
              </button>
              <button
                onClick={() => handleSortChange('departure')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'departure' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Departure Time
              </button>
              <button
                onClick={() => handleSortChange('comfort')}
                className={`px-3 py-1 rounded-full text-sm ${
                  sortOption === 'comfort' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Comfort Level
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {sortedFlights.map((deal, index) => {
              const departureAirport = deal.segments?.[0]?.departureAirport;
              const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
              const departureTime = deal.segments?.[0]?.departureTime || "N/A";
              const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
              const tripType = deal.tripType || "N/A";
              const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";
              
              // Calculate duration for display
              const durationMinutes = calculateDuration(departureTime, arrivalTime);
              const hours = Math.floor(durationMinutes / 60);
              const minutes = Math.round(durationMinutes % 60);
              const formattedDuration = `${hours}h ${minutes}m`;

              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  {/* Flight Tags */}
                  {deal.tags?.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      {deal.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-sm rounded-full ${
                            tag === "Cheapest"
                              ? "bg-green-100 text-green-700"
                              : tag === "Fastest"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Flight Route */}
                  <div className="border-b pb-3 mb-3">
                    <div className="grid grid-cols-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Departure</h3>
                        <p className="text-gray-600">
                          {departureAirport?.name || "Unknown Airport"}, {departureAirport?.countryName || "Unknown Country"}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-blue-500 font-medium">{tripType}</span>
                        <div className="text-xs mt-1">{formattedDuration}</div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Arrival</h3>
                        <p className="text-gray-600">
                          {arrivalAirport?.name || "Unknown Airport"}, {arrivalAirport?.countryName || "Unknown Country"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flight Timing */}
                  <div className="flex justify-between text-gray-600 mb-3">
                    <div>
                      <p className="font-medium">Departure Time</p>
                      <p className="text-sm">{departureTime}</p>
                    </div>
                    <div>
                      <p className="font-medium">Arrival Time</p>
                      <p className="text-sm">{arrivalTime}</p>
                    </div>
                  </div>

                  {/* Comfort Level Indicator */}
                  <div className="mb-3">
                    <p className="font-medium">Comfort Level:</p>
                    <div className="flex items-center mt-1">
                      {deal.segments?.[0]?.legs?.length > 1 ? (
                        <>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full w-1/3"></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">Low (Multi-stop)</span>
                        </>
                      ) : deal.tags?.includes("Fastest") ? (
                        <>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-full"></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">High (Fastest)</span>
                        </>
                      ) : (
                        <>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full w-2/3"></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">Medium</span>
                        </>
                      )}
                    </div>
                  </div>                  {/* Price */}
                  <div className="bg-gray-100 p-3 rounded-md mb-4">
                    <p className="text-gray-700 font-semibold">Total Price:</p>
                    <p className="text-xl font-bold text-blue-600">RS. {convertUsdToPkr(price)}</p>
                  </div>
                  <button
                    onClick={() => handleViewFlightDetails(deal.token)}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Flight Details Sidebar */}
      {showFlightDetailsSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeFlightDetailsSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div className="h-full bg-white shadow-xl flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-6 bg-blue-600 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Flight Details</h2>
                  <button 
                    onClick={closeFlightDetailsSidebar}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                  {loadingFlightDetails ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner />
                    </div>
                  ) : flightDetailsError ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                      <p>{flightDetailsError}</p>
                    </div>
                  ) : flightDetailsData ? (
                    <div className="space-y-6">
                      {/* Trip Type Indicator */}
                      <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <h2 className="text-xl font-semibold text-blue-800">
                          {flightDetailsData.tripType === "ROUNDTRIP" ? "Round Trip" : "One Way"}
                        </h2>
                        <p className="text-gray-600">
                          {flightDetailsData.segments?.[0]?.departureAirport?.cityName} ↔ {flightDetailsData.segments?.[0]?.arrivalAirport?.cityName}
                        </p>
                      </div>

                      {/* OUTBOUND FLIGHT */}
                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                          <h2 className="text-xl font-semibold text-blue-800">Outbound Flight</h2>
                        </div>
                        
                        {/* Flight Route */}
                        <div className="mb-4">
                          {flightDetailsData.segments?.[0]?.legs?.length === 1 ? (
                            // Direct flight display
                            <div className="flex justify-between items-center">
                              <div className="text-center">
                                <p className="text-xl font-bold">{flightDetailsData.segments?.[0]?.departureAirport?.code}</p>
                                <p className="text-sm">{flightDetailsData.segments?.[0]?.departureAirport?.cityName}</p>
                              </div>
                              <div className="flex-1 px-4 text-center">
                                <div className="relative">
                                  <div className="border-t-2 border-gray-300 w-full absolute top-1/2"></div>
                                  <div className="relative flex justify-center">
                                    <div className="bg-white px-2 text-xs text-gray-500">
                                      {flightDetailsData.segments?.[0]?.departureTime && flightDetailsData.segments?.[0]?.arrivalTime ? 
                                        (() => {
                                          const durationMinutes = calculateDuration(
                                            flightDetailsData.segments[0].departureTime,
                                            flightDetailsData.segments[0].arrivalTime
                                          );
                                          const hours = Math.floor(durationMinutes / 60);
                                          const minutes = Math.round(durationMinutes % 60);
                                          return `${hours}h ${minutes}m`;
                                        })() : "N/A"
                                      }
                                    </div>
                                  </div>
                                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M13 5.5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5.5z"></path>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold">{flightDetailsData.segments?.[0]?.arrivalAirport?.code}</p>
                                <p className="text-sm">{flightDetailsData.segments?.[0]?.arrivalAirport?.cityName}</p>
                              </div>
                            </div>
                          ) : (
                            // Multi-stop flight display
                            <div>
                              <div className="flex items-center mb-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="ml-1 text-xs font-medium text-yellow-700">
                                  {flightDetailsData.segments?.[0]?.legs?.length - 1} {flightDetailsData.segments?.[0]?.legs?.length - 1 === 1 ? 'Stop' : 'Stops'}
                                </span>
                              </div>
                              
                              {/* Flight path visualization */}
                              <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gray-300"></div>
                                
                                {/* Iterate through all legs */}
                                {flightDetailsData.segments?.[0]?.legs?.map((leg, index) => (
                                  <div key={index} className="mb-6 relative">
                                    {/* Departure */}
                                    <div className="flex mb-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 z-10">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="flex items-baseline">
                                          <p className="text-lg font-bold">{leg.departureAirport?.code}</p>
                                          <p className="ml-2 text-sm text-gray-600">{leg.departureAirport?.cityName}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          {leg.departureTime ? 
                                            new Date(leg.departureTime).toLocaleString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            }) : "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-500">{leg.departureAirport?.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Flight details */}
                                    <div className="flex ml-4 pl-4 mb-3">
                                      <div className="flex-none">
                                        {leg.carriersData && leg.carriersData[0] && (
                                          <img
                                            src={leg.carriersData[0].logo}
                                            alt={leg.carriersData[0].name}
                                            className="w-6 h-6 rounded-full object-contain"
                                          />
                                        )}
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-xs font-medium">
                                          {leg.carriersData?.[0]?.name || "Unknown Airline"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Flight {leg.flightInfo?.flightNumber || "N/A"} • {leg.cabinClass || "Economy"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {leg.departureTime && leg.arrivalTime ? 
                                            (() => {
                                              const durationMinutes = calculateDuration(
                                                leg.departureTime,
                                                leg.arrivalTime
                                              );
                                              const hours = Math.floor(durationMinutes / 60);
                                              const minutes = Math.round(durationMinutes % 60);
                                              return `Duration: ${hours}h ${minutes}m`;
                                            })() : "Duration: N/A"
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Arrival */}
                                    <div className="flex">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 z-10">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="flex items-baseline">
                                          <p className="text-lg font-bold">{leg.arrivalAirport?.code}</p>
                                          <p className="ml-2 text-sm text-gray-600">{leg.arrivalAirport?.cityName}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          {leg.arrivalTime ? 
                                            new Date(leg.arrivalTime).toLocaleString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            }) : "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-500">{leg.arrivalAirport?.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Layover information (except for last leg) */}
                                    {index < flightDetailsData.segments[0].legs.length - 1 && (
                                      <div className="pl-4 ml-4 mt-2 mb-4 py-2 border-l-2 border-dashed border-gray-300">
                                        <div className="bg-gray-50 p-2 rounded-md">
                                          <p className="text-sm text-orange-600 font-medium">Layover</p>
                                          <p className="text-xs text-gray-600">
                                            {leg.arrivalTime && flightDetailsData.segments[0].legs[index + 1]?.departureTime ? 
                                              (() => {
                                                const layoverMinutes = calculateDuration(
                                                  leg.arrivalTime,
                                                  flightDetailsData.segments[0].legs[index + 1].departureTime
                                                );
                                                const hours = Math.floor(layoverMinutes / 60);
                                                const minutes = Math.round(layoverMinutes % 60);
                                                return `${hours}h ${minutes}m in ${leg.arrivalAirport?.cityName} (${leg.arrivalAirport?.code})`;
                                              })() : "Duration unknown"
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Flight Timing */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-medium">Departure</p>
                            <p className="text-gray-700 text-lg">
                              {flightDetailsData.segments?.[0]?.departureTime ? 
                                new Date(flightDetailsData.segments[0].departureTime).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flightDetailsData.segments?.[0]?.departureTime ? 
                              new Date(flightDetailsData.segments[0].departureTime).toLocaleString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : ""}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Arrival</p>
                          <p className="text-gray-700 text-lg">
                            {flightDetailsData.segments?.[0]?.arrivalTime ? 
                              new Date(flightDetailsData.segments[0].arrivalTime).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flightDetailsData.segments?.[0]?.arrivalTime ? 
                              new Date(flightDetailsData.segments[0].arrivalTime).toLocaleString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : ""}
                          </p>
                        </div>
                      </div>

                      {/* Airline Information */}
                      <div className="mb-4">
                        <h3 className="font-medium mb-2">Airline</h3>
                        {flightDetailsData.segments?.[0]?.legs?.[0]?.carriersData?.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <img
                              src={flightDetailsData.segments[0].legs[0].carriersData[0].logo}
                              alt={`${flightDetailsData.segments[0].legs[0].carriersData[0].name} logo`}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{flightDetailsData.segments[0].legs[0].carriersData[0].name}</p>
                              <p className="text-xs text-gray-500">Flight {flightDetailsData.segments[0].legs[0].flightInfo?.flightNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Luggage Information */}
                      <div className="mb-4 bg-gray-50 p-2 rounded">
                        <h3 className="font-medium mb-1">Luggage</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Cabin Luggage</p>
                            <p>
                              {flightDetailsData.segments?.[0]?.travellerCabinLuggage?.[0]?.luggageAllowance?.maxPiece || 0} piece(s),{" "}
                              {flightDetailsData.segments?.[0]?.travellerCabinLuggage?.[0]?.luggageAllowance?.maxWeightPerPiece || 0}{" "}
                              {flightDetailsData.segments?.[0]?.travellerCabinLuggage?.[0]?.luggageAllowance?.massUnit || ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Checked Luggage</p>
                            <p>
                              {flightDetailsData.segments?.[0]?.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxPiece || "Not included"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RETURN FLIGHT - Only show for round trips */}
                    {flightDetailsData.tripType === "ROUNDTRIP" && flightDetailsData.segments?.length > 1 && (
                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                          <h2 className="text-xl font-semibold text-green-800">Return Flight</h2>
                        </div>
                        
                        {/* Flight Route */}
                        <div className="mb-4">
                          {flightDetailsData.segments?.[1]?.legs?.length === 1 ? (
                            // Direct flight display
                            <div className="flex justify-between items-center">
                              <div className="text-center">
                                <p className="text-xl font-bold">{flightDetailsData.segments?.[1]?.departureAirport?.code}</p>
                                <p className="text-sm">{flightDetailsData.segments?.[1]?.departureAirport?.cityName}</p>
                              </div>
                              <div className="flex-1 px-4 text-center">
                                <div className="relative">
                                  <div className="border-t-2 border-gray-300 w-full absolute top-1/2"></div>
                                  <div className="relative flex justify-center">
                                    <div className="bg-white px-2 text-xs text-gray-500">
                                      {flightDetailsData.segments?.[1]?.departureTime && flightDetailsData.segments?.[1]?.arrivalTime ? 
                                        (() => {
                                          const durationMinutes = calculateDuration(
                                            flightDetailsData.segments[1].departureTime,
                                            flightDetailsData.segments[1].arrivalTime
                                          );
                                          const hours = Math.floor(durationMinutes / 60);
                                          const minutes = Math.round(durationMinutes % 60);
                                          return `${hours}h ${minutes}m`;
                                        })() : "N/A"
                                      }
                                    </div>
                                  </div>
                                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M13 5.5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5.5z"></path>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold">{flightDetailsData.segments?.[1]?.arrivalAirport?.code}</p>
                                <p className="text-sm">{flightDetailsData.segments?.[1]?.arrivalAirport?.cityName}</p>
                              </div>
                            </div>
                          ) : (
                            // Multi-stop flight display
                            <div>
                              <div className="flex items-center mb-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="ml-1 text-xs font-medium text-yellow-700">
                                  {flightDetailsData.segments?.[1]?.legs?.length - 1} {flightDetailsData.segments?.[1]?.legs?.length - 1 === 1 ? 'Stop' : 'Stops'}
                                </span>
                              </div>
                              
                              {/* Flight path visualization */}
                              <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gray-300"></div>
                                
                                {/* Iterate through all legs */}
                                {flightDetailsData.segments?.[1]?.legs?.map((leg, index) => (
                                  <div key={index} className="mb-6 relative">
                                    {/* Departure */}
                                    <div className="flex mb-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 z-10">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="flex items-baseline">
                                          <p className="text-lg font-bold">{leg.departureAirport?.code}</p>
                                          <p className="ml-2 text-sm text-gray-600">{leg.departureAirport?.cityName}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          {leg.departureTime ? 
                                            new Date(leg.departureTime).toLocaleString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            }) : "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-500">{leg.departureAirport?.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Flight details */}
                                    <div className="flex ml-4 pl-4 mb-3">
                                      <div className="flex-none">
                                        {leg.carriersData && leg.carriersData[0] && (
                                          <img
                                            src={leg.carriersData[0].logo}
                                            alt={leg.carriersData[0].name}
                                            className="w-6 h-6 rounded-full object-contain"
                                          />
                                        )}
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-xs font-medium">
                                          {leg.carriersData?.[0]?.name || "Unknown Airline"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Flight {leg.flightInfo?.flightNumber || "N/A"} • {leg.cabinClass || "Economy"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {leg.departureTime && leg.arrivalTime ? 
                                            (() => {
                                              const durationMinutes = calculateDuration(
                                                leg.departureTime,
                                                leg.arrivalTime
                                              );
                                              const hours = Math.floor(durationMinutes / 60);
                                              const minutes = Math.round(durationMinutes % 60);
                                              return `Duration: ${hours}h ${minutes}m`;
                                            })() : "Duration: N/A"
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Arrival */}
                                    <div className="flex">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 z-10">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="flex items-baseline">
                                          <p className="text-lg font-bold">{leg.arrivalAirport?.code}</p>
                                          <p className="ml-2 text-sm text-gray-600">{leg.arrivalAirport?.cityName}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          {leg.arrivalTime ? 
                                            new Date(leg.arrivalTime).toLocaleString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            }) : "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-500">{leg.arrivalAirport?.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Layover information (except for last leg) */}
                                    {index < flightDetailsData.segments[1].legs.length - 1 && (
                                      <div className="pl-4 ml-4 mt-2 mb-4 py-2 border-l-2 border-dashed border-gray-300">
                                        <div className="bg-gray-50 p-2 rounded-md">
                                          <p className="text-sm text-orange-600 font-medium">Layover</p>
                                          <p className="text-xs text-gray-600">
                                            {leg.arrivalTime && flightDetailsData.segments[1].legs[index + 1]?.departureTime ? 
                                              (() => {
                                                const layoverMinutes = calculateDuration(
                                                  leg.arrivalTime,
                                                  flightDetailsData.segments[1].legs[index + 1].departureTime
                                                );
                                                const hours = Math.floor(layoverMinutes / 60);
                                                const minutes = Math.round(layoverMinutes % 60);
                                                return `${hours}h ${minutes}m in ${leg.arrivalAirport?.cityName} (${leg.arrivalAirport?.code})`;
                                              })() : "Duration unknown"
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Flight Timing */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-medium">Departure</p>
                            <p className="text-gray-700 text-lg">
                              {flightDetailsData.segments?.[1]?.departureTime ? 
                                new Date(flightDetailsData.segments[1]?.departureTime).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flightDetailsData.segments?.[1]?.departureTime ? 
                                new Date(flightDetailsData.segments[1]?.departureTime).toLocaleString('en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : ""}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Arrival</p>
                            <p className="text-gray-700 text-lg">
                              {flightDetailsData.segments?.[1]?.arrivalTime ? 
                                new Date(flightDetailsData.segments[1]?.arrivalTime).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flightDetailsData.segments?.[1]?.arrivalTime ? 
                                new Date(flightDetailsData.segments[1]?.arrivalTime).toLocaleString('en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : ""}
                            </p>
                          </div>
                        </div>

                        {/* Airline Information */}
                        <div className="mb-4">
                          <h3 className="font-medium mb-2">Airline</h3>
                          {flightDetailsData.segments?.[1]?.legs?.[0]?.carriersData?.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <img
                                src={flightDetailsData.segments[1].legs[0].carriersData[0].logo}
                                alt={`${flightDetailsData.segments[1].legs[0].carriersData[0].name} logo`}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="font-medium">{flightDetailsData.segments[1].legs[0].carriersData[0].name}</p>
                                <p className="text-xs text-gray-500">Flight {flightDetailsData.segments[1].legs[0].flightInfo?.flightNumber}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Luggage Information */}
                        <div className="mb-4 bg-gray-50 p-2 rounded">
                          <h3 className="font-medium mb-1">Luggage</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Cabin Luggage</p>
                              <p>
                                {flightDetailsData.segments?.[1]?.travellerCabinLuggage?.[0]?.luggageAllowance?.maxPiece || 0} piece(s),{" "}
                                {flightDetailsData.segments?.[1]?.travellerCabinLuggage?.[0]?.luggageAllowance?.maxWeightPerPiece || 0}{" "}
                                {flightDetailsData.segments?.[1]?.travellerCabinLuggage?.[0]?.luggageAllowance?.massUnit || ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Checked Luggage</p>
                              <p>
                                {flightDetailsData.segments?.[1]?.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxPiece || "Not included"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="border-b pb-4">
                      <h2 className="text-xl font-semibold">Price</h2>
                      <p className="text-green-600 font-bold text-xl">
                        RS. {convertUsdToPkr(flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units) || "N/A"}
                      </p>
                    </div>

                    {/* Additional Information */}
                    <div className="border-b pb-4">
                      <h2 className="text-xl font-semibold">Additional Information</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">Cabin Class</p>
                          <p className="text-gray-600">{flightDetailsData.segments?.[0]?.legs?.[0]?.cabinClass || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Trip Type</p>
                          <p className="text-gray-600">{flightDetailsData.tripType || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Fare Rules and Policies */}
                    <div className="border-b pb-4">
                      <h2 className="text-xl font-semibold">Fare Rules</h2>
                      <div className="mt-2 text-sm">
                        {flightDetailsData.brandedFareInfo?.features?.map((feature, index) => (
                          <div key={index} className="mb-2 flex items-start">
                            <span className={`mr-2 ${feature.availability === 'INCLUDED' ? 'text-green-500' : 'text-red-500'}`}>
                              {feature.availability === 'INCLUDED' ? '✓' : '✗'}
                            </span>
                            <div>
                              <p className="font-medium">{feature.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={handlePaymentClick}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No flight details available.</p>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}