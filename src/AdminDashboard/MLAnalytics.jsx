import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, setDoc, doc, query, where, addDoc } from "firebase/firestore";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

export default function MLAnalytics() {
  const [loading, setLoading] = useState(true);
  const [cityFrequency, setCityFrequency] = useState({});
  const [priceHistory, setPriceHistory] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [commonRoutes, setCommonRoutes] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Add new state variables for manual search
  const [searchMode, setSearchMode] = useState("userdata"); // "userdata" or "manual"
  const [manualFrom, setManualFrom] = useState("");
  const [manualTo, setManualTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  useEffect(() => {
    const fetchFlightData = async () => {
      setLoading(true);
      try {
        const flightsRef = collection(db, "user_flights");
        const flightsSnapshot = await getDocs(flightsRef);

        const flights = [];
        flightsSnapshot.forEach(doc => {
          const flightData = doc.data();
          flights.push({
            id: doc.id,
            ...flightData
          });
        });

        const cityMap = {};

        flights.forEach(flight => {
          if (flight.flightDetails) {
            if (flight.flightDetails.departure) {
              const departure = flight.flightDetails.departure;
              cityMap[departure] = (cityMap[departure] || 0) + 1;
            }

            if (flight.flightDetails.arrival) {
              const arrival = flight.flightDetails.arrival;
              cityMap[arrival] = (cityMap[arrival] || 0) + 1;
            }
          }
        });

        const routePairs = {};
        flights.forEach(flight => {
          if (flight.flightDetails && flight.flightDetails.departure && flight.flightDetails.arrival) {
            const departureFull = flight.flightDetails.departure;
            const arrivalFull = flight.flightDetails.arrival;
            
            const routeKey = `${departureFull} to ${arrivalFull}`;
            
            if (routePairs[routeKey]) {
              routePairs[routeKey].count++;
            } else {
              routePairs[routeKey] = { 
                count: 1, 
                departure: departureFull,
                arrival: arrivalFull 
              };
            }
          }
        });

        const sortedRoutes = Object.entries(routePairs)
          .map(([route, data]) => ({ 
            route, 
            count: data.count, 
            departure: data.departure, 
            arrival: data.arrival
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setCommonRoutes(sortedRoutes);

        setCityFrequency(cityMap);
      } catch (error) {
        console.error("Error fetching flight data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightData();
  }, []);

  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch airport/city suggestions
  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    console.log(`[API] Fetching suggestions for "${query}"...`);
    const apiHost = "booking-com15.p.rapidapi.com";
    const url = `https://${apiHost}/api/v1/flights/searchDestination?query=${encodeURIComponent(query)}`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": apiHost,
      },
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (result?.data?.length > 0) {
        console.log(`[API] Found ${result.data.length} suggestions for "${query}"`);
        setSuggestions(result.data);
      } else {
        console.log(`[API] No suggestions found for "${query}"`);
        setSuggestions([]);
      }
    } catch (error) {
      console.error(`[API ERROR] Error fetching suggestions for "${query}":`, error);
      setSuggestions([]);
    }
  };

  // Debounced fetch for suggestions
  const debouncedFetchFromSuggestions = debounce((query) => {
    fetchSuggestions(query, setFromSuggestions);
  }, 300);

  const debouncedFetchToSuggestions = debounce((query) => {
    fetchSuggestions(query, setToSuggestions);
  }, 300);

  // Handle "From" input change
  const handleFromChange = (e) => {
    const query = e.target.value;
    setManualFrom(query);
    debouncedFetchFromSuggestions(query);
  };

  // Handle "To" input change
  const handleToChange = (e) => {
    const query = e.target.value;
    setManualTo(query);
    debouncedFetchToSuggestions(query);
  };

  // Handle selection of a suggestion
  const handleSuggestionClick = (suggestion, setField, setSuggestions) => {
    setField(suggestion.name);
    setSuggestions([]);
  };

  // Handle search mode change
  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    setPriceHistory([]); // Clear previous results when changing modes
    setPriceError('');
  };

  // Handle manual search button click
  const handleManualSearch = () => {
    if (manualFrom && manualTo) {
      fetchHistoricalPrices(manualFrom, manualTo);
    } else {
      setPriceError('Please enter both departure and arrival cities');
    }
  };

  // Function to check if price data exists in Firebase
  const checkCachedPriceData = async (departure, arrival) => {
    try {
      const routeKey = `${departure}:${arrival}`.toLowerCase();
      const docRef = doc(db, "flight_analysis", routeKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastUpdated = data.timestamp?.toDate() || new Date(0);
        const now = new Date();
        const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          return data.priceHistory;
        } else {
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[FIREBASE ERROR] Error checking cached price data: ${error.message}`, error);
      return null;
    }
  };
  
  // Function to save price data to Firebase
  const savePriceDataToFirebase = async (departure, arrival, priceHistory) => {
    try {
      const routeKey = `${departure}:${arrival}`.toLowerCase();
      await setDoc(doc(db, "flight_analysis", routeKey), {
        departure,
        arrival,
        priceHistory,
        timestamp: new Date(),
        dataSource: priceHistory.length >= 3 ? "API" : "Mock",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[FIREBASE ERROR] Error saving price data: ${error.message}`, error);
    }
  };

  const fetchHistoricalPrices = async (departure, arrival) => {
    if (!departure || !arrival) {
      setPriceError('Please select a valid route');
      return;
    }
    
    setLoadingPrices(true);
    setPriceError('');
    
    try {
      const cachedData = await checkCachedPriceData(departure, arrival);
      
      if (cachedData && cachedData.length > 0) {
        setPriceHistory(cachedData);
        setLoadingPrices(false);
        return;
      }
      
      const apiHost = "booking-com15.p.rapidapi.com";
      const apiKey = RAPIDAPI_KEY;
      
      const departureSearchUrl = `https://${apiHost}/api/v1/flights/searchDestination?query=${encodeURIComponent(departure)}`;
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost
        }
      };
      
      const departureResponse = await fetch(departureSearchUrl, options);
      const departureData = await departureResponse.json();
      
      if (!departureData.status || !departureData.data || departureData.data.length === 0) {
        throw new Error(`Could not find departure airport "${departure}"`);
      }
      
      const arrivalSearchUrl = `https://${apiHost}/api/v1/flights/searchDestination?query=${encodeURIComponent(arrival)}`;
      const arrivalResponse = await fetch(arrivalSearchUrl, options);
      const arrivalData = await arrivalResponse.json();
      
      if (!arrivalData.status || !arrivalData.data || arrivalData.data.length === 0) {
        throw new Error(`Could not find arrival airport "${arrival}"`);
      }
      
      const fromId = departureData.data[0].id;
      const toId = arrivalData.data[0].id;
      
      const today = new Date();
      let historicalPrices = [];
      
      const datesToCheck = [];
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (30 - i * 5));
        datesToCheck.push(date.toISOString().split('T')[0]);
      }
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(today.getDate() + (i * 5));
        datesToCheck.push(date.toISOString().split('T')[0]);
      }
      
      const pricePromises = datesToCheck.map(async (date, index) => {
        try {
          await new Promise(resolve => setTimeout(resolve, index * 200));
          
          const url = `https://${apiHost}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${date}&currency_code=INR`;
          
          const response = await fetch(url, options);
          const result = await response.json();
          
          if (result.status === true && result.data?.flightOffers?.length > 0) {
            const cheapestFlight = result.data.flightOffers.reduce((prev, current) => {
              const prevPrice = prev.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
              const currentPrice = current.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
              return prevPrice < currentPrice ? prev : current;
            });
            
            const price = cheapestFlight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || null;
            
            if (price) {
              return {
                date,
                price: parseInt(price, 10),
                lowestPrice: Math.round(parseInt(price, 10) * 0.9),
                highestPrice: Math.round(parseInt(price, 10) * 1.1)
              };
            }
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const priceResults = await Promise.all(pricePromises);
      
      historicalPrices = priceResults
        .filter(result => result !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (historicalPrices.length >= 3) {
        setPriceHistory(historicalPrices);
        savePriceDataToFirebase(departure, arrival, historicalPrices);
      } else {
        const mockData = generateMockPriceData(historicalPrices, 60);
        setPriceHistory(mockData);
        savePriceDataToFirebase(departure, arrival, mockData);
      }
    } catch (error) {
      setPriceError('Failed to fetch historical price data: ' + error.message);
      const mockData = generateMockPriceData([], 60);
      setPriceHistory(mockData);
      savePriceDataToFirebase(departure, arrival, mockData);
    } finally {
      setLoadingPrices(false);
    }
  };
  
  const generateMockPriceData = (realDataPoints, numPoints) => {
    const today = new Date();
    
    let basePrice = 8000;
    let priceVariation = 2000;
    
    if (realDataPoints.length > 0) {
      basePrice = Math.round(
        realDataPoints.reduce((sum, point) => sum + point.price, 0) / realDataPoints.length
      );
      
      if (realDataPoints.length > 1) {
        const prices = realDataPoints.map(p => p.price);
        priceVariation = Math.round(Math.max(...prices) - Math.min(...prices)) / 2;
      }
    }
    
    const result = Array.from({ length: numPoints }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (numPoints - i));
      
      const dayOfWeek = date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      
      const weekdayFactor = isWeekend ? 1.1 : 0.95;
      
      const seasonalFactor = Math.sin((i / numPoints) * Math.PI) * 0.2 + 0.9;
      
      const randomFactor = 0.9 + (Math.random() * 0.2);
      
      const combinedFactor = weekdayFactor * seasonalFactor * randomFactor;
      
      const price = Math.max(3000, Math.round(basePrice * combinedFactor));
      
      return {
        date: date.toISOString().split('T')[0],
        price: price,
        lowestPrice: Math.round(price * 0.9),
        highestPrice: Math.round(price * 1.1)
      };
    });
    
    return result;
  };

  const handleRouteChange = (e) => {
    const selectedValue = e.target.value;  
    setSelectedRoute(selectedValue);
    
    if (selectedValue) {
      const selectedRoute = commonRoutes.find(route => 
        `${route.departure} to ${route.arrival}` === selectedValue
      );
      
      if (selectedRoute) {
        fetchHistoricalPrices(
          selectedRoute.departure || selectedRoute.departure,
          selectedRoute.arrival || selectedRoute.arrival
        );
      } else {
        const [departure, arrival] = selectedValue.split(' to ');
        fetchHistoricalPrices(departure, arrival);
      }
    } else { 
      setPriceHistory([]);
    }
  };
  
  const calculatePriceTrends = () => {
    if (priceHistory.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const difference = lastPrice - firstPrice;
    const percentageChange = ((difference / firstPrice) * 100).toFixed(2);
    
    let trend = 'neutral';
    if (difference > 0) trend = 'up';        
    if (difference < 0) trend = 'down';
            
    return { trend, percentage: Math.abs(percentageChange) };
  };
  
  const priceTrend = calculatePriceTrends();
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Popular Cities</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(cityFrequency)
                    .sort((a, b) => b[1] - a[1])
                    .map(([city, count], index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            {Object.keys(cityFrequency).length === 0 && (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">No city data available.</p>
                <p className="text-sm text-gray-400 mt-2">Check the user_flights collection in Firebase.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Historical Price Analysis</h2>
            
            {/* Search Mode Selector */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex p-1 bg-gray-200 rounded-lg">
                <button
                  onClick={() => handleSearchModeChange("userdata")}
                  className={`px-6 py-2 rounded-md transition-all duration-200 ${
                    searchMode === "userdata" 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-transparent text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  From User Data
                </button>
                <button
                  onClick={() => handleSearchModeChange("manual")}
                  className={`px-6 py-2 rounded-md transition-all duration-200 ${
                    searchMode === "manual" 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-transparent text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Manual Search
                </button>
              </div>
            </div>
            
            {/* Search Interface - Either dropdown or manual input fields */}
            {searchMode === "userdata" ? (
              <div className="mb-6">
                <label htmlFor="routeSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Route:
                </label>
                <select
                  id="routeSelect"
                  value={selectedRoute}
                  onChange={handleRouteChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select a route --</option>
                  {commonRoutes.map((routeData, index) => (
                    <option key={index} value={`${routeData.departure} to ${routeData.arrival}`}>
                      {routeData.departure} to {routeData.arrival} ({routeData.count} flights)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* From field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From
                    </label>
                    <input
                      type="text"
                      value={manualFrom}
                      onChange={handleFromChange}
                      placeholder="Departure city or airport"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {fromSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {fromSuggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion, setManualFrom, setFromSuggestions)}
                          >
                            {suggestion.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* To field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <input
                      type="text"
                      value={manualTo}
                      onChange={handleToChange}
                      placeholder="Arrival city or airport"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {toSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {toSuggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion, setManualTo, setToSuggestions)}
                          >
                            {suggestion.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {/* Search button */}
                <button
                  onClick={handleManualSearch}
                  disabled={!manualFrom || !manualTo || loadingPrices}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    !manualFrom || !manualTo || loadingPrices
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loadingPrices ? "Searching..." : "Search Price History"}
                </button>
              </div>
            )}
            
            {/* Display price data */}
            {loadingPrices ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : priceError ? (
              <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-red-700">{priceError}</p>
              </div>
            ) : priceHistory.length > 0 ? (
              <div>
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Price Trend Analysis</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">60-Day Trend:</span>
                    <div className={`flex items-center ${
                      priceTrend.trend === 'up' ? 'text-red-600' : 
                      priceTrend.trend === 'down' ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {priceTrend.trend === 'up' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0114 7z" clipRule="evenodd" />
                        </svg>
                      )}
                      {priceTrend.trend === 'down' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 10.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414l3.293 3.293A1 1 0 0014 13z" clipRule="evenodd" />
                        </svg>
                      )}
                      {priceTrend.trend === 'neutral' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-bold ml-1">
                        {priceTrend.percentage}% {priceTrend.trend === 'up' ? 'increase' : priceTrend.trend === 'down' ? 'decrease' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Starting Price: <span className="font-medium">RS{priceHistory[0].price.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Price: <span className="font-medium">RS{priceHistory[priceHistory.length - 1].price.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">60-Day Price History</h3>
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <div className="w-full h-64 relative">
                      <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                        <g className="grid-lines">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={i}
                              x1="0"
                              y1={i * 60}
                              x2="1000"
                              y2={i * 60}
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          ))}
                        </g>
                        
                        {priceHistory.length > 0 && (
                          <path
                            d={priceHistory.map((point, i) => {
                              const prices = priceHistory.map(p => p.price);
                              const minPrice = Math.min(...prices) * 0.9;
                              const maxPrice = Math.max(...prices) * 1.1;
                              
                              const x = (i / (priceHistory.length - 1)) * 1000;
                              const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                              
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                        )}
                        
                        {priceHistory.map((point, i) => {
                          const prices = priceHistory.map(p => p.price);
                          const minPrice = Math.min(...prices) * 0.9;
                          const maxPrice = Math.max(...prices) * 1.1;
                          
                          const x = (i / (priceHistory.length - 1)) * 1000;
                          const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                          
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
                      
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 py-2">
                        {(() => {
                          const prices = priceHistory.map(p => p.price);
                          const minPrice = Math.min(...prices) * 0.9;
                          const maxPrice = Math.max(...prices) * 1.1;
                          const step = (maxPrice - minPrice) / 4;
                          
                          return [0, 1, 2, 3, 4].map(i => (
                            <div key={i}>RS{Math.round(maxPrice - i * step).toLocaleString()}</div>
                          ));
                        })()}
                      </div>
                      
                      <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-500">
                        {[0, 15, 30, 45, 59].map(i => {
                          if (i < priceHistory.length) {
                            return (
                              <div key={i}>{new Date(priceHistory[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Price Statistics</h3>
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistic</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">Lowest Price (60 days)</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          RS{Math.min(...priceHistory.map(p => p.price)).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">Highest Price (60 days)</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          RS{Math.max(...priceHistory.map(p => p.price)).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">Average Price</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          RS{Math.round(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">Price Volatility</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {(() => {
                            const prices = priceHistory.map(p => p.price);
                            const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
                            const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
                            const stdDev = Math.sqrt(variance);
                            const volatilityPercent = ((stdDev / avg) * 100).toFixed(1);
                            
                            let volatilityLevel = 'Low';
                            if (volatilityPercent > 15) volatilityLevel = 'High';
                            else if (volatilityPercent > 8) volatilityLevel = 'Medium';
                            
                            return `${volatilityLevel} (${volatilityPercent}%)`;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-gray-600">
                  {searchMode === "userdata" 
                    ? "Select a route to view historical price data" 
                    : "Enter departure and arrival cities to search"
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">Price trends help identify the best time to book flights</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
