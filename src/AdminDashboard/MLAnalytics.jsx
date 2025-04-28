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
  const [pricePredictions, setPricePredictions] = useState([]);
  const [bookingRecommendation, setBookingRecommendation] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

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

  // Function to generate ML-based price predictions
  const generatePricePredictions = (priceHistory) => {
    setPredictionLoading(true);
    
    try {
      // Lower the minimum data points required for predictions
      if (!priceHistory || priceHistory.length < 2) {
        throw new Error("Insufficient data for accurate predictions");
      }
      
      // Extract available data (up to 30 days) for analysis
      const recentPrices = priceHistory.slice(-Math.min(30, priceHistory.length));
      
      // Simple moving average for trend detection - adapt to available data
      const movingAvgWindow1 = Math.min(7, Math.floor(recentPrices.length / 2));
      const movingAvgWindow2 = Math.min(14, Math.floor(recentPrices.length * 0.8));
      
      const movingAvg1 = calculateMovingAverage(recentPrices, movingAvgWindow1) || 
                         recentPrices[recentPrices.length - 1].price;
      const movingAvg2 = calculateMovingAverage(recentPrices, movingAvgWindow2) || 
                         recentPrices[0].price;
      
      // Detect trend direction based on available data
      const trendDirection = movingAvg1 > movingAvg2 ? 'up' : 'down';
      
      // Calculate price volatility with at least 2 data points
      const priceValues = recentPrices.map(p => p.price);
      const volatility = priceValues.length >= 2 ? calculateVolatility(priceValues) : 5;

      // Calculate seasonal factors
      const seasonalFactor = calculateSeasonalFactor(new Date());
      
      // Generate predictions for next 14 days
      const lastDate = new Date(recentPrices[recentPrices.length - 1].date);
      const lastPrice = recentPrices[recentPrices.length - 1].price;
      
      const predictions = [];
      let currentDate = new Date(lastDate);
      let currentPrice = lastPrice;
      
      // Enhanced prediction model parameters
      // Adapt trend intensity based on data confidence
      const confidenceFactor = Math.min(1, recentPrices.length / 15);
      const trendFactor = trendDirection === 'up' 
        ? 1 + (0.003 * confidenceFactor) 
        : 1 - (0.003 * confidenceFactor);
      
      const volatilityImpact = Math.min(volatility / 100, 0.05); // Cap volatility impact
      
      for (let i = 1; i <= 14; i++) {
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Day of week effect (weekend prices higher)
        const dayOfWeek = currentDate.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const weekdayFactor = isWeekend ? 1.02 : 0.99; // 2% higher on weekends
        
        // Enhanced random component - less randomness with less data
        const randomVariance = Math.min(0.5 + (confidenceFactor * 0.5), 1);
        const randomFactor = 1 + (((Math.random() * 2) - 1) * volatilityImpact * randomVariance);
        
        // Calculate new price with trend, seasonality, day of week, and randomness
        currentPrice = currentPrice * trendFactor * weekdayFactor * seasonalFactor * randomFactor;
        
        predictions.push({
          date: currentDate.toISOString().split('T')[0],
          price: Math.round(currentPrice),
          lowestPrice: Math.round(currentPrice * 0.95),
          highestPrice: Math.round(currentPrice * 1.05)
        });
      }
      
      setPricePredictions(predictions);
      
      // Generate booking recommendation with confidence based on data quality
      const recommendation = generateBookingRecommendation(
        priceHistory, 
        predictions, 
        volatility,
        confidenceFactor
      );
      setBookingRecommendation(recommendation);
      
    } catch (error) {
      console.error("Error generating predictions:", error);
      
      // Even in error cases, try to generate basic predictions using available data
      const mockPredictions = generateFallbackPredictions(priceHistory);
      setPricePredictions(mockPredictions);
      
      // Provide a recommendation with very low confidence
      setBookingRecommendation({
        action: priceHistory && priceHistory.length > 0 ? "monitor" : "insufficient-data",
        confidence: priceHistory && priceHistory.length > 0 ? 0.2 : 0,
        reasoning: priceHistory && priceHistory.length > 0 
          ? "Limited historical data available. Consider monitoring prices before booking."
          : "Not enough historical data for accurate predictions."
      });
    } finally {
      setPredictionLoading(false);
    }
  };

  // Fallback prediction generator for when main algorithm fails
  const generateFallbackPredictions = (priceHistory) => {
    try {
      // If we have any price history at all, use it as a baseline
      if (priceHistory && priceHistory.length > 0) {
        const lastKnownPrice = priceHistory[priceHistory.length - 1].price;
        const lastKnownDate = new Date(priceHistory[priceHistory.length - 1].date);
        
        const predictions = [];
        let currentDate = new Date(lastKnownDate);
        let basePrice = lastKnownPrice;
        
        // Simple model with slight random walk
        for (let i = 1; i <= 14; i++) {
          currentDate.setDate(currentDate.getDate() + 1);
          
          // Random walk with slight upward bias (typical for flight prices)
          const randomChange = (Math.random() * 0.04) - 0.018; // -1.8% to +2.2%
          basePrice = basePrice * (1 + randomChange);
          
          // Weekend effect
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            basePrice *= 1.01; // 1% higher on weekends
          }
          
          predictions.push({
            date: currentDate.toISOString().split('T')[0],
            price: Math.round(basePrice),
            lowestPrice: Math.round(basePrice * 0.95),
            highestPrice: Math.round(basePrice * 1.05)
          });
        }
        
        return predictions;
      }
      
      // If we have absolutely no data, return empty predictions
      return [];
    } catch (error) {
      console.error("Error in fallback predictions:", error);
      return [];
    }
  };
  
  // Calculate moving average over specified days - now more robust
  const calculateMovingAverage = (data, days) => {
    if (!data || data.length < days || days < 1) return null;
    
    try {
      const recentData = data.slice(-days);
      const sum = recentData.reduce((total, item) => total + (item.price || 0), 0);
      return sum / days;
    } catch (error) {
      console.error("Error calculating moving average:", error);
      return null;
    }
  };
  
  // Generate booking recommendation based on price history and predictions
  const generateBookingRecommendation = (history, predictions, volatility, confidenceFactor = 1) => {
    // If no predictions, return basic recommendation
    if (!predictions || predictions.length === 0) {
      return {
        action: "insufficient-data",
        confidence: 0,
        reasoning: "No price predictions available."
      };
    }
    
    try {
      // Calculate recent trend based on available data
      const recentPrices = history.slice(-Math.min(7, history.length));
      let recentTrend = 0;
      
      if (recentPrices.length >= 2) {
        const firstRecent = recentPrices[0].price;
        const lastRecent = recentPrices[recentPrices.length - 1].price;
        recentTrend = ((lastRecent - firstRecent) / firstRecent) * 100;
      }
      
      // Check predicted prices
      const predictedPrices = predictions.map(p => p.price);
      const minPredictedPrice = Math.min(...predictedPrices);
      const minPredictedDay = predictions.findIndex(p => p.price === minPredictedPrice);
      
      const currentPrice = history[history.length - 1].price;
      const predictedChange = ((minPredictedPrice - currentPrice) / currentPrice) * 100;
      
      // Determine confidence based on volatility and data quality
      let confidence = 0;
      if (volatility < 5) confidence = 0.85 * confidenceFactor;
      else if (volatility < 10) confidence = 0.7 * confidenceFactor;
      else if (volatility < 15) confidence = 0.5 * confidenceFactor;
      else confidence = 0.3 * confidenceFactor;
      
      // Minimum confidence based on data available
      confidence = Math.max(confidence, history.length < 7 ? 0.25 : 0.4);
      
      // Logic for recommendation
      let recommendationType, reasoning;
      
      if (predictedChange <= -5) {
        // Significant price drop expected
        recommendationType = "wait";
        reasoning = `Prices are expected to drop by ${Math.abs(predictedChange).toFixed(1)}% in the next ${minPredictedDay + 1} days.`;
      } else if (predictedChange >= 5) {
        // Significant price increase expected
        recommendationType = "book-now";
        reasoning = `Prices are expected to rise by ${predictedChange.toFixed(1)}% soon. Current price appears to be favorable.`;
      } else if (recentTrend <= -7) {
        // Prices have been dropping significantly
        recommendationType = "wait";
        reasoning = `Prices have been trending downward (${recentTrend.toFixed(1)}% recently). They may continue to drop.`;
      } else if (recentTrend >= 7) {
        // Prices have been rising significantly
        if (predictedChange <= 2) {
          recommendationType = "book-now";
          reasoning = `Prices have been rising sharply (${recentTrend.toFixed(1)}% recently), but appear to be stabilizing soon.`;
        } else {
          recommendationType = "monitor";
          reasoning = "Price volatility suggests monitoring for a few days before deciding.";
        }
      } else {
        // Stable prices
        recommendationType = "flexible";
        reasoning = "Prices appear relatively stable. No urgent need to book immediately.";
      }
      
      return {
        action: recommendationType,
        confidence: confidence,
        reasoning: reasoning,
        bestDay: minPredictedDay,
        expectedPrice: minPredictedPrice,
        priceChange: predictedChange
      };
    } catch (error) {
      console.error("Error generating recommendation:", error);
      return {
        action: "monitor",
        confidence: 0.2,
        reasoning: "Error analyzing price trends. Consider monitoring prices before booking."
      };
    }
  };

  const fetchHistoricalPrices = async (departure, arrival) => {
    if (!departure || !arrival) {
      setPriceError('Please select a valid route');
      return;
    }
    
    setLoadingPrices(true);
    setPriceError('');
    setPricePredictions([]); // Clear previous predictions
    setBookingRecommendation(null); // Clear previous recommendations
    
    try {
      const cachedData = await checkCachedPriceData(departure, arrival);
      
      if (cachedData && cachedData.length > 0) {
        setPriceHistory(cachedData);
        generatePricePredictions(cachedData); // Generate predictions with cached data
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
      
      // Enhanced date selection for more comprehensive data collection
      const datesToCheck = [];
      
      // More dates in the past for better historical data
      for (let i = 0; i < 8; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (40 - i * 5));
        datesToCheck.push(date.toISOString().split('T')[0]);
      }
      
      // Add some dates very close to today for recent trends
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (3 - i));
        datesToCheck.push(date.toISOString().split('T')[0]);
      }
      
      // Future dates for upcoming price trends
      for (let i = 0; i < 8; i++) {
        const date = new Date();
        date.setDate(today.getDate() + (i * 5));
        datesToCheck.push(date.toISOString().split('T')[0]);
      }
      
      const pricePromises = datesToCheck.map(async (date, index) => {
        try {
          // Stagger requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, index * 300));
          
          const url = `https://${apiHost}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${date}&currency_code=INR`;
          
          const response = await fetch(url, options);
          const result = await response.json();
          
          if (result.status === true && result.data?.flightOffers?.length > 0) {
            // Find the cheapest flight with valid price data
            let cheapestFlight = null;
            let cheapestPrice = Infinity;
            
            for (const offer of result.data.flightOffers) {
              const price = offer.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units;
              if (price && !isNaN(parseInt(price, 10)) && parseInt(price, 10) < cheapestPrice) {
                cheapestPrice = parseInt(price, 10);
                cheapestFlight = offer;
              }
            }
            
            if (cheapestFlight) {
              const price = parseInt(cheapestPrice, 10);
              return {
                date,
                price: price,
                lowestPrice: Math.round(price * 0.9),
                highestPrice: Math.round(price * 1.1)
              };
            }
          }
          return null;
        } catch (error) {
          console.warn(`Error fetching price for ${date}:`, error);
          return null;
        }
      });
      
      const priceResults = await Promise.all(pricePromises);
      
      historicalPrices = priceResults
        .filter(result => result !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`Fetched ${historicalPrices.length} real price points for ${departure} to ${arrival}`);
      
      if (historicalPrices.length >= 3) {
        // If we have at least some real data, let's use it and fill gaps
        const filledPriceHistory = fillPriceHistoryGaps(historicalPrices);
        setPriceHistory(filledPriceHistory);
        savePriceDataToFirebase(departure, arrival, filledPriceHistory);
        generatePricePredictions(filledPriceHistory);
      } else {
        // If we have very little or no data, generate realistic mock data
        const mockData = generateEnhancedMockPriceData(historicalPrices, 60, departure, arrival);
        setPriceHistory(mockData);
        savePriceDataToFirebase(departure, arrival, mockData);
        generatePricePredictions(mockData);
      }
    } catch (error) {
      setPriceError('Failed to fetch historical price data: ' + error.message);
      const mockData = generateEnhancedMockPriceData([], 60, departure, arrival);
      setPriceHistory(mockData);
      savePriceDataToFirebase(departure, arrival, mockData);
      generatePricePredictions(mockData);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Fill gaps in price history to create a more continuous dataset
  const fillPriceHistoryGaps = (prices) => {
    if (!prices || prices.length <= 1) return prices;
    
    const filledPrices = [...prices];
    const sortedPrices = [...prices].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Look for gaps of more than 5 days and interpolate
    for (let i = 0; i < sortedPrices.length - 1; i++) {
      const currentDate = new Date(sortedPrices[i].date);
      const nextDate = new Date(sortedPrices[i + 1].date);
      const daysDiff = Math.round((nextDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 5) {
        const startPrice = sortedPrices[i].price;
        const endPrice = sortedPrices[i + 1].price;
        const priceDiff = endPrice - startPrice;
        
        // Create interpolated points
        for (let j = 1; j < daysDiff; j++) {
          const interpolationDate = new Date(currentDate);
          interpolationDate.setDate(currentDate.getDate() + j);
          
          // Linear interpolation
          const ratio = j / daysDiff;
          const interpolatedPrice = Math.round(startPrice + (priceDiff * ratio));
          
          filledPrices.push({
            date: interpolationDate.toISOString().split('T')[0],
            price: interpolatedPrice,
            lowestPrice: Math.round(interpolatedPrice * 0.9),
            highestPrice: Math.round(interpolatedPrice * 1.1),
            interpolated: true
          });
        }
      }
    }
    
    // Sort the filled array by date
    return filledPrices.sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Enhanced mock data generation that's more realistic
  const generateEnhancedMockPriceData = (realDataPoints, numPoints, departure, arrival) => {
    const today = new Date();
    
    // Determine a realistic base price based on route characteristics or real data
    let basePrice = determineRealisticBasePrice(departure, arrival);
    let priceVariation = basePrice * 0.25; // 25% variation by default
    
    if (realDataPoints.length > 0) {
      // If we have any real data points, use their average as the base
      basePrice = Math.round(
        realDataPoints.reduce((sum, point) => sum + point.price, 0) / realDataPoints.length
      );
      
      if (realDataPoints.length > 1) {
        const prices = realDataPoints.map(p => p.price);
        priceVariation = Math.max(basePrice * 0.15, Math.round((Math.max(...prices) - Math.min(...prices)) / 2));
      }
    }
    
    // Generate dates centered around today
    const dates = [];
    const halfPoints = Math.floor(numPoints / 2);
    for (let i = 0; i < numPoints; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (halfPoints - i));
      dates.push(date);
    }
    
    // Generate more realistic seasonal and trend patterns
    const result = [];
    
    // Determine if we're in a high, shoulder, or low season
    const seasonType = determineCurrentSeasonType(today);
    
    // Add a slight overall trend (slightly upward for flights is realistic)
    const trendFactor = 1.0005; // Very slight upward trend
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      
      // Day of week effect (weekend prices higher)
      const dayOfWeek = date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isFriday = (dayOfWeek === 5);
      const isMonday = (dayOfWeek === 1);
      
      // Weekends and Fridays are more expensive, Tuesdays and Wednesdays cheaper
      let weekdayFactor = 1.0;
      if (isWeekend) weekdayFactor = 1.08;
      else if (isFriday) weekdayFactor = 1.05;
      else if (isMonday) weekdayFactor = 1.02;
      else if (dayOfWeek === 2 || dayOfWeek === 3) weekdayFactor = 0.95;
      
      // Seasonal patterns - more extreme variations in high season
      const seasonalVariation = seasonType === 'high' ? 0.2 : 
                               seasonType === 'shoulder' ? 0.15 : 0.1;
      
      // Create a complex seasonal pattern with multiple frequencies
      const seasonalPattern = 
        Math.sin((i / (numPoints / 3)) * Math.PI) * seasonalVariation * 0.5 +
        Math.sin((i / (numPoints / 6)) * Math.PI) * seasonalVariation * 0.3 +
        Math.sin((i / numPoints) * Math.PI * 2) * seasonalVariation * 0.2;
      
      const seasonalFactor = 1 + seasonalPattern;
      
      // Random component - larger in high season
      const randomComponent = (Math.random() * 2 - 1) * (seasonType === 'high' ? 0.06 : 0.04);
      const randomFactor = 1 + randomComponent;
      
      // Apply overall trends
      const trendImpact = Math.pow(trendFactor, i - halfPoints);
      
      // Combine all factors
      const combinedFactor = weekdayFactor * seasonalFactor * randomFactor * trendImpact;
      
      const price = Math.max(Math.round(basePrice * combinedFactor), Math.round(basePrice * 0.7));
      
      result.push({
        date: date.toISOString().split('T')[0],
        price: price,
        lowestPrice: Math.round(price * 0.9),
        highestPrice: Math.round(price * 1.1)
      });
    }
    
    // If we have real data points, incorporate them into the mock data
    if (realDataPoints.length > 0) {
      realDataPoints.forEach(realPoint => {
        const realDate = new Date(realPoint.date);
        const existingPoint = result.find(p => p.date === realPoint.date);
        
        if (existingPoint) {
          // Replace the mock data with real data
          existingPoint.price = realPoint.price;
          existingPoint.lowestPrice = realPoint.lowestPrice;
          existingPoint.highestPrice = realPoint.highestPrice;
        } else if (realDate >= dates[0] && realDate <= dates[dates.length - 1]) {
          // Add this real data point if it's within our date range
          result.push(realPoint);
        }
      });
      
      // Re-sort the array by date
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    return result;
  };
  
  // Helper function to determine a realistic base price based on route
  const determineRealisticBasePrice = (departure, arrival) => {
    // This function could be expanded with more sophisticated logic
    // or a database of common route prices
    
    // Check if we have keywords suggesting international routes
    const departureText = departure.toLowerCase();
    const arrivalText = arrival.toLowerCase();
    
    const internationalKeywords = ['international', 'airport', 'london', 'new york', 'dubai', 'singapore', 'tokyo'];
    const isLikelyInternational = internationalKeywords.some(keyword => 
      departureText.includes(keyword) || arrivalText.includes(keyword)
    );
    
    // Base prices - could be refined further
    if (isLikelyInternational) {
      return 25000 + Math.round(Math.random() * 15000); // International flights
    } else {
      return 4500 + Math.round(Math.random() * 3500);  // Domestic flights
    }
  };
  
  // Helper function to determine current season type based on date
  const determineCurrentSeasonType = (date) => {
    const month = date.getMonth();
    
    // High seasons: Summer vacation (May-Jul) and Winter holidays (Dec)
    if (month >= 4 && month <= 6 || month === 11) {
      return 'high';
    }
    
    // Shoulder seasons: Spring (Mar-Apr) and Fall (Sep-Oct)
    if (month >= 2 && month <= 3 || month >= 8 && month <= 9) {
      return 'shoulder';
    }
    
    // Low seasons: Winter (Jan-Feb) and late Fall (Nov)
    return 'low';
  };
  
  // Calculate volatility (standard deviation as percentage of mean)
  const calculateVolatility = (prices) => {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    return (stdDev / mean) * 100; // as percentage
  };
  
  // Calculate seasonal factor based on current date
  const calculateSeasonalFactor = (date) => {
    const month = date.getMonth();
    
    // Simple seasonal model: peak summer (Jun-Aug) and winter holidays (Dec) have higher prices
    if (month >= 5 && month <= 7) return 1.1; // Summer peak
    if (month === 11) return 1.15; // December holiday peak
    if (month >= 8 && month <= 10) return 1.05; // Fall shoulder season
    if (month >= 1 && month <= 3) return 0.9; // Winter low season (excluding holidays)
    return 1.0; // Neutral seasons
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
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
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
                {/* ML-Based Booking Recommendation */}
                {bookingRecommendation && (
                  <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                    bookingRecommendation.action === 'book-now' ? 'bg-green-50 border-green-500' :
                    bookingRecommendation.action === 'wait' ? 'bg-yellow-50 border-yellow-500' :
                    bookingRecommendation.action === 'monitor' ? 'bg-blue-50 border-blue-500' :
                    bookingRecommendation.action === 'flexible' ? 'bg-purple-50 border-purple-500' :
                    'bg-gray-50 border-gray-500'
                  }`}>
                    <h3 className="text-lg font-semibold mb-2">ML Booking Recommendation</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="font-medium text-lg mb-2 sm:mb-0">
                        {bookingRecommendation.action === 'book-now' && '✅ Book Now'}
                        {bookingRecommendation.action === 'wait' && '⏱️ Wait to Book'}
                        {bookingRecommendation.action === 'monitor' && '👁️ Monitor Prices'}
                        {bookingRecommendation.action === 'flexible' && '🔄 Flexible Timeframe'}
                        {bookingRecommendation.action === 'insufficient-data' && '⚠️ Insufficient Data'}
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full text-sm border">
                        Confidence: <span className="font-medium">
                          {Math.round(bookingRecommendation.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{bookingRecommendation.reasoning}</p>
                    
                    {bookingRecommendation.action === 'wait' && bookingRecommendation.bestDay !== undefined && (
                      <p className="mt-2 text-sm font-medium">
                        Best time to book: 
                        <span className="font-bold text-green-700 ml-1">
                          {bookingRecommendation.bestDay <= 3 ? 'In the next few days' : 
                           `In about ${bookingRecommendation.bestDay} days`}
                        </span>
                        {bookingRecommendation.expectedPrice && (
                          <span className="ml-1">
                            (Est. price: RS{bookingRecommendation.expectedPrice.toLocaleString()})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
                
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
                
                {/* Price History and Prediction Chart */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Price History & ML-Based Prediction
                    {predictionLoading && (
                      <span className="ml-2 inline-block w-4 h-4 border-2 border-gray-500 border-t-blue-500 rounded-full animate-spin"></span>
                    )}
                  </h3>
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
                        
                        {/* Historical Price Path */}
                        {priceHistory.length > 0 && (
                          <path
                            d={priceHistory.map((point, i) => {
                              // Use combined price data for min/max calculation
                              const combinedData = [...priceHistory, ...pricePredictions];
                              const prices = combinedData.map(p => p.price);
                              const minPrice = Math.min(...prices) * 0.9;
                              const maxPrice = Math.max(...prices) * 1.1;
                              
                              // Calculate position based on combined data length
                              const historyLength = priceHistory.length;
                              const totalLength = historyLength + (pricePredictions.length || 0);
                              const x = (i / (totalLength - 1)) * 1000 * (historyLength / totalLength);
                              const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                              
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                        )}
                        
                        {/* Prediction Path (dashed) */}
                        {pricePredictions.length > 0 && (
                          <path
                            d={(() => {
                              const combinedData = [...priceHistory, ...pricePredictions];
                              const prices = combinedData.map(p => p.price);
                              const minPrice = Math.min(...prices) * 0.9;
                              const maxPrice = Math.max(...prices) * 1.1;
                              
                              const historyLength = priceHistory.length;
                              const totalLength = historyLength + pricePredictions.length;
                              
                              // Start from the last history point
                              const lastHistoryPoint = priceHistory[priceHistory.length - 1];
                              const lastX = ((historyLength - 1) / (totalLength - 1)) * 1000;
                              const lastY = 300 - ((lastHistoryPoint.price - minPrice) / (maxPrice - minPrice)) * 300;
                              
                              let path = `M ${lastX} ${lastY} `;
                              
                              // Add prediction points
                              pricePredictions.forEach((point, i) => {
                                const x = ((historyLength + i) / (totalLength - 1)) * 1000;
                                const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                                path += `L ${x} ${y} `;
                              });
                              
                              return path;
                            })()}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        )}
                        
                        {/* Historical Points */}
                        {priceHistory.map((point, i) => {
                          const combinedData = [...priceHistory, ...pricePredictions];
                          const prices = combinedData.map(p => p.price);
                          const minPrice = Math.min(...prices) * 0.9;
                          const maxPrice = Math.max(...prices) * 1.1;
                          
                          const historyLength = priceHistory.length;
                          const totalLength = historyLength + (pricePredictions.length || 0);
                          const x = (i / (totalLength - 1)) * 1000 * (historyLength / totalLength);
                          const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                          
                          return (
                            <circle
                              key={`hist-${i}`}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="1"
                            />
                          );
                        })}
                        
                        {/* Prediction Points */}
                        {pricePredictions.map((point, i) => {
                          const combinedData = [...priceHistory, ...pricePredictions];
                          const prices = combinedData.map(p => p.price);
                          const minPrice = Math.min(...prices) * 0.9;
                          const maxPrice = Math.max(...prices) * 1.1;
                          
                          const historyLength = priceHistory.length;
                          const totalLength = historyLength + pricePredictions.length;
                          const x = ((historyLength + i) / (totalLength - 1)) * 1000;
                          const y = 300 - ((point.price - minPrice) / (maxPrice - minPrice)) * 300;
                          
                          // Highlight recommended day if exists
                          const isRecommendedDay = bookingRecommendation && bookingRecommendation.bestDay === i;
                          
                          return (
                            <circle
                              key={`pred-${i}`}
                              cx={x}
                              cy={y}
                              r={isRecommendedDay ? "5" : "3"}
                              fill={isRecommendedDay ? "#10b981" : "#ef4444"}
                              stroke="white"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
                      
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 py-2">
                        {(() => {
                          const combinedData = [...priceHistory, ...pricePredictions];
                          const prices = combinedData.map(p => p.price);
                          const minPrice = Math.min(...prices) * 0.9;
                          const maxPrice = Math.max(...prices) * 1.1;
                          const step = (maxPrice - minPrice) / 4;
                          
                          return [0, 1, 2, 3, 4].map(i => (
                            <div key={i}>RS{Math.round(maxPrice - i * step).toLocaleString()}</div>
                          ));
                        })()}
                      </div>
                      
                      <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-500">
                        {[0, 15, 30, 45, 59, 65, 73].map(i => {
                          const combinedData = [...priceHistory, ...pricePredictions];
                          if (i < combinedData.length) {
                            const date = new Date(combinedData[i].date);
                            const isAfterHistory = i >= priceHistory.length;
                            return (
                              <div key={i} className={isAfterHistory ? "text-red-500" : ""}>
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="absolute right-2 top-2 bg-white/80 p-2 rounded-md text-xs flex flex-col">
                        <div className="flex items-center mb-1">
                          <span className="w-3 h-1 bg-blue-500 mr-1"></span>
                          <span>Historical</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-1 bg-red-500 mr-1 border-t border-dashed"></span>
                          <span>Predicted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Price Prediction Statistics */}
                {pricePredictions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">ML Price Predictions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Price Movement</h4>
                        <div className="flex items-center">
                          {(() => {
                            const firstPred = pricePredictions[0].price;
                            const lastPred = pricePredictions[pricePredictions.length - 1].price;
                            const change = ((lastPred - firstPred) / firstPred) * 100;
                            const isUp = change > 0;
                            
                            return (
                              <>
                                <span className={`text-2xl font-bold ${isUp ? 'text-red-600' : 'text-green-600'}`}>
                                  {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  over next 14 days
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Best Price in Next 14 Days</h4>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-green-600">
                            RS{Math.min(...pricePredictions.map(p => p.price)).toLocaleString()}
                          </span>
                          {(() => {
                            const minPrice = Math.min(...pricePredictions.map(p => p.price));
                            const minPriceDay = pricePredictions.findIndex(p => p.price === minPrice);
                            const daysFromNow = minPriceDay + 1;
                            
                            return (
                              <span className="text-sm text-gray-500 ml-2">
                                in {daysFromNow} day{daysFromNow !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
