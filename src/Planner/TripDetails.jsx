import React, { useEffect, useState } from "react";
import Spinner from '../Components/Spinner';
import { FaStar } from "react-icons/fa";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import BookTrip from "../Components/BookTrip";
import { toast } from "react-toastify";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

// Add a function to fetch the correct dest_id for a city
const fetchDestinationId = async (city) => {
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
        console.log("Destination ID API Response:", result);

        if (result?.data?.length > 0) {
            return result.data[0].id; // Return the first matching dest_id
        } else {
            console.error("No destination ID found for city:", city);
            return null;
        }
    } catch (error) {
        console.error("Error fetching destination ID for city:", city, error);
        return null;
    }
};

// Helper function to determine if a string is an airport code
const isAirportCode = (str) => {
  // Common patterns for airport codes
  return (
    // Three letters followed by .AIRPORT
    /^[A-Z]{3}\.AIRPORT$/i.test(str) || 
    // Just three letters (might need additional validation)
    /^[A-Z]{3}$/i.test(str) ||
    // IATA format with city/airport pattern
    /^[A-Z]{3}\.[A-Z]+$/i.test(str)
  );
};

// Function to properly search for hotels using the API with improved error handling
const searchHotels = async (cityOrAirport, arrivalDate, departureDate) => {
  try {
    // Check if input might be an airport code
    if (isAirportCode(cityOrAirport)) {
      console.log(`Detected airport code: ${cityOrAirport}, will search for the city instead`);
      
      // Extract the airport code part if it's in format like "ISB.AIRPORT"
      const airportCode = cityOrAirport.split('.')[0];
      
      // Map of common airport codes to cities (could be expanded)
      const airportToCity = {
        'ISB': 'Islamabad',
        'LHE': 'Lahore',
        'KHI': 'Karachi',
        'PEW': 'Peshawar',
        'UET': 'Quetta',
        'SKZ': 'Sukkur',
        'LYP': 'Faisalabad',
        'MUX': 'Multan',
        'DXB': 'Dubai',
        'JFK': 'New York',
        'LAX': 'Los Angeles',
        'LHR': 'London',
        // Add more mappings as needed
      };
      
      if (airportToCity[airportCode]) {
        console.log(`Converted airport code ${airportCode} to city: ${airportToCity[airportCode]}`);
        cityOrAirport = airportToCity[airportCode];
      }
    }
    
    // Step 1: Search for destination to get dest_id and search_type
    const destinationUrl = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(cityOrAirport)}`;
    console.log("Searching for destination with URL:", destinationUrl);
    
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": API_HOST,
      },
    };

    const destinationResponse = await fetch(destinationUrl, options);
    if (!destinationResponse.ok) {
      console.error("Destination search API error:", destinationResponse.status);
      throw new Error(`Destination search failed with status: ${destinationResponse.status}`);
    }
    
    const destinationResult = await destinationResponse.json();
    console.log("Destination search response:", destinationResult);

    if (!destinationResult.status || !destinationResult.data || destinationResult.data.length === 0) {
      console.error("No destination found for query:", cityOrAirport);
      return [];
    }

    // Log all the destination types for debugging
    console.log("Available destination types:", destinationResult.data.map(d => 
      `${d.name} (Type: ${d.dest_type || 'unknown'}, SearchType: ${d.search_type || 'unknown'})`));
    
    // Filter out hotel suggestions, only keep cities and filter by name
    const filteredResults = destinationResult.data.filter(suggestion => {
      // Prioritize cities and regions over hotels
      if (suggestion.dest_type) {
        const destType = suggestion.dest_type.toLowerCase();
        // Prefer city, region, and airport results
        if (destType.includes('city') || destType.includes('region') || destType.includes('airport')) {
          return true;
        }
      }
        
      // Exclude hotels by checking search_type
      if (suggestion.search_type && suggestion.search_type.toUpperCase() === "HOTEL") {
        return false;
      }
      
      // Check if dest_type is available and contains "hotel"
      if (suggestion.dest_type && suggestion.dest_type.toLowerCase().includes("hotel")) {
        return false;
      }
      
      // Check name property for hotel indicators
      if (suggestion.name && (
        suggestion.name.toLowerCase().includes(" hotel") ||
        suggestion.name.toLowerCase().includes("resort") ||
        suggestion.name.toLowerCase().includes("inn") ||
        suggestion.name.toLowerCase().includes("suites") ||
        suggestion.name.toLowerCase().includes(" lodge") ||
        suggestion.name.toLowerCase().includes(" villa") ||
        suggestion.name.toLowerCase().includes("apartment")
      )) {
        return false;
      }
      
      return true;
    });
    
    if (filteredResults.length === 0) {
      console.error("No city destinations found for query:", cityOrAirport);
      return [];
    }
    
    // Get the first city result
    const destinationData = filteredResults[0];
    
    // Always use "CITY" as search_type to avoid API issues with hotels
    const searchType = "CITY";
    
    // Log what we're doing
    console.log(`Using search_type="CITY" for all hotel searches regardless of destination type`);
    console.log(`Selected destination: ${destinationData.name} (${destinationData.dest_id})`);
    
    // If original value was different, log it for debugging
    if (destinationData.search_type && destinationData.search_type.toUpperCase() !== "CITY") {
      console.log(`Note: Original search_type was "${destinationData.search_type}" but we're forcing "CITY"`);
    }
    
    const destId = destinationData.dest_id;
    console.log(`Found destination: ${destinationData.name}, dest_id: ${destId}, search_type: ${searchType}`);

    // Create proper ISO date strings
    const arrivalDateStr = new Date(arrivalDate).toISOString().split('T')[0];
    
    // For departure date, ensure it's at least one day after arrival
    let departureDateObj = new Date(departureDate);
    const arrivalDateObj = new Date(arrivalDate);
    
    // If departure is before arrival, add one day to arrival
    if (departureDateObj <= arrivalDateObj) {
      departureDateObj = new Date(arrivalDateObj);
      departureDateObj.setDate(arrivalDateObj.getDate() + 1);
    }
    
    const departureDateStr = departureDateObj.toISOString().split('T')[0];
    
    console.log("Using dates:", { arrivalDateStr, departureDateStr });
    
    // Step 2: Use the dest_id to search for hotels with the correct search_type
    const url = new URL(`https://${API_HOST}/api/v1/hotels/searchHotels`);
    url.searchParams.append("dest_id", destId);
    url.searchParams.append("search_type", searchType);  // Always CITY for consistent results
    url.searchParams.append("adults", 1);
    url.searchParams.append("room_qty", 1);
    url.searchParams.append("arrival_date", arrivalDateStr);
    url.searchParams.append("departure_date", departureDateStr);
    url.searchParams.append("page_number", 1);
    url.searchParams.append("units", "metric");
    url.searchParams.append("temperature_unit", "c");
    url.searchParams.append("languagecode", "en-us");
    url.searchParams.append("currency_code", "USD");
    
    console.log("Searching for hotels with URL:", url.toString());
    console.log("Search parameters:", {
      destId,
      searchType,
      arrivalDate: arrivalDateStr,
      departureDate: departureDateStr,
    });

    const hotelsResponse = await fetch(url, options);
    
    // Log response status and headers for debugging
    console.log("Hotel API Response Status:", hotelsResponse.status);
    const responseHeaders = {};
    hotelsResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log("Hotel API Response Headers:", responseHeaders);
    
    if (!hotelsResponse.ok) {
      console.error("Hotel search API error:", hotelsResponse.status);
      try {
        const errorText = await hotelsResponse.text();
        console.error("API Error details:", errorText);
      } catch (e) {
        console.error("Could not read error response text");
      }
      throw new Error(`Hotel search failed with status: ${hotelsResponse.status}`);
    }
    
    const hotelsResult = await hotelsResponse.json();
    console.log("Hotels search response:", hotelsResult);

    // Added more defensive checks
    if (!hotelsResult) {
      console.error("Hotel search returned no result");
      return [];
    }
    
    if (!hotelsResult.status) {      
      // Check for specific API error messages
      const errorMsg = hotelsResult.message || "Unknown error";
      console.error("Hotel search returned error status:", errorMsg);
      
      // Log the error but don't try different search_type since we're always using CITY
      console.error("Hotel search failed with search_type=CITY. Error:", errorMsg);
      
      // Try to provide a more helpful error message
      if (errorMsg.toLowerCase().includes("dest_id")) {
        console.error("This appears to be a destination ID issue. The API may not recognize this location as a city.");
      }
      
      return [];
    }
    
    if (!hotelsResult.data) {
      console.error("Hotel search returned no data");
      return [];
    }
    
    if (!hotelsResult.data.hotels) {
      console.error("Hotel search data contains no hotels array");
      return [];
    }
    
    const hotels = hotelsResult.data.hotels;
    console.log(`SUCCESS! Found ${hotels.length} hotels for destination "${cityOrAirport}" with search_type=CITY`);
    
    // Add some extra debug info for the first few hotels
    if (hotels.length > 0) {
      const sample = hotels.slice(0, 2).map(hotel => ({
        id: hotel.hotel_id,
        name: hotel.property?.name,
        price: hotel.property?.priceBreakdown?.grossPrice?.value,
        photoUrl: hotel.property?.photoUrls?.[0] || "No photo"
      }));
      console.log("Sample hotels:", sample);
    }
    
    // Return the hotels data
    return hotels;
  } catch (error) {
    console.error("Error searching for hotels:", error);
    // Include error information for debugging
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      cityOrAirport,
      arrivalDate,
      departureDate
    });
    return [];
  }
};

const TripDetails = ({ searchResults, onFlightSelect, onHotelSelect}) => {
    const navigate = useNavigate();
    const uid = localStorage.getItem("userId");
    
    const [showFlightDetailsSidebar, setShowFlightDetailsSidebar] = useState(false);
    const [flightDetailsToken, setFlightDetailsToken] = useState(null);
    const [flightDetailsData, setFlightDetailsData] = useState(null);
    const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);
    const [flightDetailsError, setFlightDetailsError] = useState("");
    
    useEffect(() => {
    }, [searchResults]);

    if (!searchResults) {
        return null;
    }

    const { fromId, toId, departureDate, returnDate, cabinClass, budget, hotelBudget, daysOfStay } = searchResults;

    if (!fromId || !toId || !departureDate) {
        return (
            <div className="text-center text-red-500 p-4">
                Missing required search parameters
            </div>
        );
    }

    const [flightOffers, setFlightOffers] = useState([]);
    const [hotelOffers, setHotelOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedFlightId, setSelectedFlightId] = useState(null);
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [totalSelectedPrice, setTotalSelectedPrice] = useState({
        flight: 0,
        hotel: 0
    });    const handleFlightClick = (token, price, flightData) => {
        // Set isRoundTrip based on the actual tripType from API or search params
        // Explicitly check if this is a one-way trip from search results
        const isOneWay = searchResults?.tripType === "ONE_WAY";
        const isRoundTrip = !isOneWay && (flightData.tripType === "ROUNDTRIP" || searchResults?.tripType === "RETURN");
        
        console.log(`Selected flight is round trip: ${isRoundTrip}, Trip Type: ${flightData.tripType}, Search Trip Type: ${searchResults?.tripType}`);
        
        setSelectedFlightId(token);
        setSelectedFlight({
            ...flightData,
            isRoundTrip, // Add this flag so we can use it when creating the trip
            tripType: isOneWay ? "ONE_WAY" : (flightData.tripType || (isRoundTrip ? "ROUNDTRIP" : "ONE_WAY"))
        });
        
        // Store original USD price (use parseFloat instead of parseInt to get decimal values)
        const usdPrice = parseFloat(price) || 0;
        
        setTotalSelectedPrice(prev => ({
            ...prev,
            flight: usdPrice
        }));
        
        // Pass both USD and PKR prices to parent component
        onFlightSelect(token, price, {
            usd: usdPrice,
            pkr: Math.floor(usdPrice * USD_TO_PKR_RATE), // Floor the PKR value to remove decimals
            isRoundTrip, // Pass this to parent component too
            // Add additional information for PDF generation
            tripType: flightData.tripType || (isRoundTrip ? "ROUNDTRIP" : "ONE_WAY"),
            segments: flightData.segments
        });
    };
      const handleHotelClick = (hotelId, price, hotelData) => {
        setSelectedHotelId(hotelId);
        setSelectedHotel(hotelData);
        
        // Store original USD price (ensure it's a number and has no more than 2 decimal places)
        const usdPrice = parseFloat(price) || 0;
        
        // Log the full hotel data and selected price for debugging
        console.log("Hotel selected:", {
            hotelId,
            price,
            usdPrice,
            pkrPrice: Math.floor(usdPrice * USD_TO_PKR_RATE),
            hotelName: hotelData.property?.name,
            daysOfStay
        });
        
        setTotalSelectedPrice(prev => ({
            ...prev,
            hotel: usdPrice
        }));
        
        // Pass both USD and PKR prices to parent component
        onHotelSelect(hotelId, price, {
            usd: usdPrice,
            pkr: Math.floor(usdPrice * USD_TO_PKR_RATE),
            totalUsd: usdPrice * (daysOfStay || 1),
            totalPkr: Math.floor(usdPrice * USD_TO_PKR_RATE * (daysOfStay || 1))
        });
    };const fetchFlights = async () => {
        if (!fromId || !toId || !departureDate) {
            toast.error("Missing required search parameters for flights.");
            return;
        }

        // Always use USD for API requests to ensure consistent currency handling
        let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=USD`;
        
        // Check if returnDate is provided - this indicates a round trip
        // Use the trip type from searchResults if available, otherwise check returnDate
        const tripTypeFromSearch = searchResults?.tripType?.toUpperCase();
        const isRoundTrip = tripTypeFromSearch === "RETURN" || (tripTypeFromSearch !== "ONE_WAY" && Boolean(returnDate));
        
        if (isRoundTrip && returnDate) {
            url += `&returnDate=${returnDate}`;
            console.log("Round trip requested with return date:", returnDate);
        } else {
            console.log("One-way trip requested (tripType:", tripTypeFromSearch || "not specified", ", returnDate:", returnDate || "none", ")");
        }
        
        if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

        console.log("Fetching flights with URL:", url);
        console.log("User budget (USD):", budget);
        console.log("User budget (PKR):", budget * USD_TO_PKR_RATE);
        console.log("Is round trip?", isRoundTrip);

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
            console.log("Flight API response:", result);

            if (result.status === true && result.data?.flightOffers?.length > 0) {
                console.log(`Found ${result.data.flightOffers.length} total flights before filtering`);
                
                // First filter by trip type if needed
                let filteredByTripType = result.data.flightOffers;
                if (isRoundTrip) {
                    // For round trips, only keep ROUNDTRIP flights
                    filteredByTripType = filteredByTripType.filter(flight => {
                        const isRoundTripFlight = flight.tripType === "ROUNDTRIP";
                        if (!isRoundTripFlight) {
                            console.log(`Filtering out one-way flight with token: ${flight.token}`);
                        }
                        return isRoundTripFlight;
                    });
                    console.log(`After filtering by trip type: ${filteredByTripType.length} round trip flights remain`);
                }

                // Then filter by budget
                const filteredFlights = filteredByTripType.filter((flight) => {
                    // Parse price as a number to ensure proper comparison
                    const priceUSD = parseFloat(flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units) || Infinity;
                    const pricePKR = priceUSD * USD_TO_PKR_RATE;
              
                    // Ensure budget is treated as a number
                    const budgetUSD = parseFloat(budget) || 0;
                    const budgetPKR = budgetUSD * USD_TO_PKR_RATE;
                    
                    console.log(`Flight: ${flight.transactionId}, Type: ${flight.tripType}, Price: $${priceUSD} USD / Rs.${Math.floor(pricePKR)} PKR, Budget: $${budgetUSD} USD / Rs.${Math.floor(budgetPKR)} PKR`);
                    
                    // Strict numerical comparison
                    const isWithinBudget = priceUSD <= budgetUSD;
                    
                    console.log(`Is within budget: ${isWithinBudget}, Price type: ${typeof priceUSD}, Budget type: ${typeof budgetUSD}`);
                    
                    return isWithinBudget;
                });

                console.log(`After filtering by budget: ${filteredFlights.length} flights remain`);
                console.log("Trip types in filtered results:", 
                    filteredFlights.map(f => f.tripType).reduce((acc, type) => {
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {})
                );
                
                if (filteredFlights.length === 0) {
                    toast.warn("No flights found within your budget. Please consider increasing your budget.");
                    setError("No flights available within your budget of Rs. " + Math.floor(budget * USD_TO_PKR_RATE) + " PKR");
                    setFlightOffers([]);
                    
                    // Sort flights by price to find the cheapest option
                    const sortedByPrice = [...result.data.flightOffers].sort((a, b) => {
                        const priceA = a.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        const priceB = b.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        return priceA - priceB;
                    });
                      if (sortedByPrice.length > 0) {
                        const cheapestPriceUSD = parseFloat(sortedByPrice[0].travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units);
                        const cheapestPricePKR = Math.floor(cheapestPriceUSD * USD_TO_PKR_RATE);
                        toast.info(`The cheapest available flight costs $${cheapestPriceUSD} USD (Rs. ${cheapestPricePKR} PKR)`);
                        console.log(`Cheapest flight price: $${cheapestPriceUSD} USD / Rs.${cheapestPricePKR} PKR, Your budget: $${parseFloat(budget)} USD / Rs.${Math.floor(parseFloat(budget) * USD_TO_PKR_RATE)} PKR`);
                    }
                } else {
                    setFlightOffers(filteredFlights);
                }
            } else {
                console.log("No flight deals found in API response");
                setError("No flight deals found.");
                setFlightOffers([]);
            }
        } catch (error) {
            console.error("Error fetching flights:", error);
            setError("Failed to fetch flight data. Please try again later.");
        }
    };    // No need for separate convertAirportIdToCityName function as it's now integrated in searchHotels
    
    const fetchHotels = async () => {
        if (!toId || !departureDate) {
            setError("Missing required search parameters for hotels.");
            return;
        }
        
        try {
            setLoading(true);
            
            console.log(`Searching for hotels in destination ID: ${toId}`);
            
            // The searchHotels function will now handle airport code conversion internally
            const hotelResults = await searchHotels(toId, departureDate, returnDate || departureDate);              if (hotelResults && hotelResults.length > 0) {
                console.log(`Successfully found ${hotelResults.length} hotels for ${toId} using search_type=CITY`);
                
                // Log the first few hotel results for debugging
                const sampleHotels = hotelResults.slice(0, 3);
                console.log("Sample hotel results:", sampleHotels.map(h => ({
                    hotel_id: h.hotel_id,
                    name: h.property?.name,
                    dest_id: h.dest_id,
                    latitude: h.property?.latitude,
                    longitude: h.property?.longitude
                })));
                
                // Success message
                toast.success(`Found ${hotelResults.length} hotels in ${toId}`);
                
                
                // Filter hotels based on budget if needed
                const filteredHotels = hotelResults.filter((hotel) => {
                    // Safely extract price with fallbacks
                    const pricePerNightUSD = parseFloat(hotel.property?.priceBreakdown?.grossPrice?.value) || Infinity;
                    const pricePerNightPKR = pricePerNightUSD * USD_TO_PKR_RATE;
                    const totalPriceUSD = pricePerNightUSD * (parseInt(daysOfStay) || 1);
                    const totalPricePKR = totalPriceUSD * USD_TO_PKR_RATE;
                    
                    console.log(`Hotel: ${hotel.property?.name}, Price/night: $${pricePerNightUSD} USD / Rs.${Math.floor(pricePerNightPKR)} PKR, Total: $${totalPriceUSD} USD / Rs.${Math.floor(totalPricePKR)} PKR`);
                    
                    // If hotelBudget is provided, filter by it
                    if (hotelBudget) {
                        const budgetUSD = parseFloat(hotelBudget) || 0;
                        const isWithinBudget = totalPriceUSD <= budgetUSD;
                        console.log(`Budget: $${budgetUSD} USD, Within budget: ${isWithinBudget}`);
                        return isWithinBudget;
                    }
                    
                    // If no budget constraints, return all hotels
                    return true;
                });
                
                console.log(`After budget filtering: ${filteredHotels.length} hotels remain`);
                setHotelOffers(filteredHotels);
                
                if (filteredHotels.length === 0) {
                    // If we found hotels but none within budget, show a specific error
                    toast.warn("No hotels found within your budget. Consider increasing your hotel budget.");
                    setError(`No hotels found within your budget of Rs. ${Math.floor(parseFloat(hotelBudget || 0) * USD_TO_PKR_RATE)} PKR`);
                    
                    // Show the cheapest option price information
                    if (hotelResults.length > 0) {
                        const sortedByPrice = [...hotelResults].sort((a, b) => {
                            const priceA = parseFloat(a.property?.priceBreakdown?.grossPrice?.value) || Infinity;
                            const priceB = parseFloat(b.property?.priceBreakdown?.grossPrice?.value) || Infinity;
                            return priceA - priceB;
                        });
                        
                        if (sortedByPrice.length > 0) {
                            const cheapestPriceUSD = parseFloat(sortedByPrice[0].property?.priceBreakdown?.grossPrice?.value);
                            const cheapestTotalUSD = cheapestPriceUSD * (parseInt(daysOfStay) || 1);
                            const cheapestTotalPKR = Math.floor(cheapestTotalUSD * USD_TO_PKR_RATE);
                            toast.info(`The cheapest available hotel costs Rs. ${cheapestTotalPKR} PKR total for ${daysOfStay || 1} nights`);
                        }
                    }
                }            } else {
                console.error("No hotels found for destination:", toId);
                setHotelOffers([]);
                
                // Check if toId looks like an airport ID - if so, provide more helpful message
                if (isAirportCode(toId)) {
                    // setError(`No hotels found for airport code: ${toId}. Try searching for the nearby city name instead.`);
                    toast.error("No hotels found for this airport code. Try searching for the city name.");
                } else {
                    // setError(`No hotels found for destination: ${toId}. Try searching for a major city nearby.`);
                    // toast.error("No hotels found for this destination. Please try a different location.");
                }
            }
        } catch (error) {
            console.error("Error in fetchHotels:", error);
            // setError(`Failed to fetch hotel data: ${error.message}`);
            setHotelOffers([]);
            toast.error("Error searching for hotels. Please try again.");
        } finally {
            setLoading(false);
        }
    };    // Use a ref to track if this is the first render
    const isInitialRender = React.useRef(true);

    useEffect(() => {
        // Only fetch data when dependencies change, not on first render
        const fetchData = async () => {
            if (isInitialRender.current) {
                isInitialRender.current = false;
                setLoading(true);
                setError("");
                
                try {
                    await fetchFlights();
                    await fetchHotels();
                } finally {
                    setLoading(false);
                }
            } else {
                // On subsequent renders (when search params change), 
                // clear selections and reload data
                setSelectedFlightId(null);
                setSelectedHotelId(null);
                setSelectedFlight(null); 
                setSelectedHotel(null); 
                setTotalSelectedPrice({ flight: 0, hotel: 0 });
                
                setLoading(true);
                setError("");
                
                try {
                    await fetchFlights();
                    await fetchHotels();
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [fromId, toId, departureDate, returnDate, cabinClass, budget, hotelBudget, daysOfStay]);

    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };    const calculateSavings = () => {
        // Get the PKR budget values from searchResults if available
        const budgetPKR = searchResults?.budgetPKR || (parseInt(budget) * USD_TO_PKR_RATE);
        const hotelBudgetPKR = searchResults?.hotelBudgetPKR || (parseInt(hotelBudget) * USD_TO_PKR_RATE);
        const totalBudgetPKR = budgetPKR + hotelBudgetPKR;
        
        // Calculate spending in PKR
        const totalHotelPricePKR = totalSelectedPrice.hotel * USD_TO_PKR_RATE * (daysOfStay || 1);
        const totalSpentPKR = totalSelectedPrice.flight * USD_TO_PKR_RATE + totalHotelPricePKR;
        
        // Calculate savings in PKR
        let savingsPKR = totalBudgetPKR - totalSpentPKR;
        savingsPKR = Math.max(0, savingsPKR);
        const savingsPercentage = totalBudgetPKR > 0 ? ((savingsPKR / totalBudgetPKR) * 100).toFixed(0) : "0"; // Rounded to whole number
        
        // Calculate USD values for internal use (but not for display)
        const totalBudget = parseInt(budget) + parseInt(hotelBudget);
        const totalHotelPrice = totalSelectedPrice.hotel * (daysOfStay || 1);
        const totalSpent = totalSelectedPrice.flight + totalHotelPrice;
        const savings = Math.max(0, totalBudget - totalSpent);
        
        return {
            amount: savings,
            amountPKR: savingsPKR,
            percentage: savingsPercentage,
            totalBudget: totalBudget,
            totalBudgetPKR: totalBudgetPKR,
            totalSpent: totalSpent,
            totalSpentPKR: totalSpentPKR
        };
    };

    const handleAddToFavorites = async () => {
        if (!selectedFlight || !selectedHotel) {
            toast.error("Please select both a flight and a hotel.");
            return;
        }
    
        try {
            const hotelPricePerDay = totalSelectedPrice.hotel || 0;
            const totalHotelPrice = hotelPricePerDay * (daysOfStay || 1);
            
            const favTripData = {
                userId: uid,
                createdAt: new Date().toISOString(),
                flight: {
                    token: selectedFlight.token || '',
                    transactionId: selectedFlight.transactionId || '',
                    flightNumber: selectedFlight.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
                    amount: totalSelectedPrice.flight * USD_TO_PKR_RATE || 0,
                    departure: selectedFlight.segments?.[0]?.departureAirport?.name || 'N/A',
                    arrival: selectedFlight.segments?.[0]?.arrivalAirport?.name || 'N/A',
                    departureTime: selectedFlight.segments?.[0]?.departureTime || 'N/A',
                    arrivalTime: selectedFlight.segments?.[0]?.arrivalTime || 'N/A',
                },
                hotel: {
                    id: selectedHotel.hotel_id || '',
                    name: selectedHotel.property?.name || 'N/A',
                    location: selectedHotel.property?.address || 'N/A',
                    pricePerDay: hotelPricePerDay * USD_TO_PKR_RATE,
                    totalPrice: totalHotelPrice * USD_TO_PKR_RATE,
                    daysOfStay: daysOfStay || 1,
                    rating: selectedHotel.property?.reviewScore || 'N/A',
                },
            };
    
            console.log("Saving trip to favorites:", favTripData);
            
            const docRef = await addDoc(collection(db, "user_fav_trips"), favTripData);
            toast.success("Trip added to favorites!");
            navigate("/my-fav-trips");
        } catch (error) {
            console.log(error);
            toast.error("Failed to add trip to favorites. Please try again.");
        }
    };

    const handleViewFlightDetails = (event, token) => {
        event.stopPropagation();
        setFlightDetailsToken(token);
        setShowFlightDetailsSidebar(true);
        fetchFlightDetails(token);
    };
    
    // Calculate flight duration
    const calculateDuration = (departureTime, arrivalTime) => {
        if (!departureTime || !arrivalTime) return 0;
        const depTime = new Date(departureTime).getTime();
        const arrTime = new Date(arrivalTime).getTime();
        return (arrTime - depTime) / (1000 * 60); // Duration in minutes
    };
    
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
                
                // Log additional details for debugging
                if (result.data.segments && result.data.segments.length > 0) {
                    console.log("Flight legs:", result.data.segments[0].legs);
                    console.log("Trip type:", result.data.tripType);
                    if (result.data.tripType === "ROUNDTRIP") {
                        console.log("Return flight info:", result.data.segments[1]);
                    }
                }
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
    
    const closeFlightDetailsSidebar = () => {
        setShowFlightDetailsSidebar(false);
    };
    
    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-800">
                    <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
                        Discover Your Perfect Package
                    </h1>
                    <p className="text-center text-gray-400 max-w-2xl mx-auto">
                        We've curated the best flight and hotel combinations within your budget. Select your preferred options to continue.
                    </p>
                </div>
        
                {error && (
                    <div className="mb-6 p-4 bg-red-900 bg-opacity-60 border-l-4 border-red-500 text-red-100 rounded-lg">
                        <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            {error}
                        </p>
                    </div>
                )}
        
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-96">
                        <Spinner />
                        <p className="mt-4 text-blue-400 animate-pulse">Finding the best packages for you...</p>
                    </div>
                ) : (
                    <>
                        {flightOffers.length > 0 ? (
                            <div className="mb-12">
                                <div className="flex flex-wrap justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-white">
                                        <span className="border-b-2 border-blue-500 pb-1">Flight Options</span>
                                    </h2>
                                    <div className="flex space-x-2 mt-2 sm:mt-0">
                                        <div className="bg-blue-900 bg-opacity-50 px-4 py-1.5 rounded-full">
                                            <span className="text-sm font-semibold text-blue-200">Budget: </span>
                                            <span className="text-sm font-bold text-white">Rs. {searchResults?.budgetPKR || (budget * USD_TO_PKR_RATE)} PKR</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {flightOffers.map((deal) => {
                                        const departureAirport = deal.segments?.[0]?.departureAirport;
                                        const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
                                        const departureTime = deal.segments?.[0]?.departureTime || "N/A";
                                        const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
                                        const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";
                                        const token = deal.token;
            
                                        return (
                                            <div
                                                key={token}
                                                className={`bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-xl shadow-lg hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer relative overflow-hidden
                                                    ${selectedFlightId === token ? 'ring-2 ring-blue-500 shadow-blue-500/30 transform scale-[1.02]' : ''}
                                                `}
                                                onClick={() => handleFlightClick(token, price, deal)}
                                            >
                                                {selectedFlightId === token && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <div className="bg-blue-500 text-white p-2 rounded-bl-lg shadow-lg">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="border-b border-gray-700 pb-3 mb-3">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-300">Departure</h3>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {departureAirport?.name || "Unknown Airport"}
                                                            </p>
                                                            <p className="text-xs text-blue-400 truncate">
                                                                {departureAirport?.countryName || "Unknown Country"}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="relative w-full flex items-center justify-center">
                                                                <div className="border-t border-dashed border-gray-600 w-full absolute"></div>
                                                                <div className="bg-blue-500 text-white p-1 rounded-full z-10 transform -translate-y-1/2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-blue-400 font-medium mt-2">
                                                                {deal.tripType === "ROUNDTRIP" ? "Round Trip" : "One-way"}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <h3 className="text-sm font-semibold text-gray-300">Arrival</h3>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {arrivalAirport?.name || "Unknown Airport"}
                                                            </p>
                                                            <p className="text-xs text-blue-400 truncate">
                                                                {arrivalAirport?.countryName || "Unknown Country"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-gray-400 mb-3">
                                                    <div>
                                                        <p className="text-xs font-medium">Departure</p>
                                                        <p className="text-xs">{departureTime}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-medium">Arrival</p>
                                                        <p className="text-xs">{arrivalTime}</p>
                                                    </div>
                                                </div>                                                <div className="bg-gray-700 p-2 rounded-lg mb-3 shadow-inner">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-gray-300 font-semibold">Price:</p>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-green-400">Rs. {Math.floor(price * USD_TO_PKR_RATE)} PKR</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="w-full bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-all text-xs font-medium flex items-center justify-center"
                                                    onClick={(e) => handleViewFlightDetails(e, token)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View Details
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-12 bg-gray-900 bg-opacity-70 border border-gray-800 rounded-lg p-6">
                                <div className="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Flight Options Available</h3>
                                    <p className="text-gray-400 text-center">No flight offers found within your budget of Rs. {searchResults?.budgetPKR || (budget * USD_TO_PKR_RATE)} PKR</p>
                                    <p className="text-gray-500 text-sm mt-2">Try increasing your flight budget for more options</p>
                                </div>
                            </div>
                        )}
            
                        {hotelOffers.length > 0 ? (
                            <div className="mb-12">
                                <div className="flex flex-wrap justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-white">
                                        <span className="border-b-2 border-purple-500 pb-1">Hotel Options</span>
                                    </h2>
                                    <div className="flex space-x-2 mt-2 sm:mt-0">
                                        <div className="bg-purple-900 bg-opacity-50 px-4 py-1.5 rounded-full flex items-center">
                                            <span className="text-sm font-semibold text-purple-200">Budget: </span>
                                            <span className="text-sm font-bold text-white ml-1">Rs. {searchResults?.hotelBudgetPKR || (hotelBudget * USD_TO_PKR_RATE)} PKR</span>
                                        </div>
                                        <div className="bg-purple-900 bg-opacity-50 px-4 py-1.5 rounded-full">
                                            <span className="text-sm font-semibold text-purple-200">Stay: </span>
                                            <span className="text-sm font-bold text-white">{daysOfStay || 1} {daysOfStay === 1 ? 'night' : 'nights'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {hotelOffers.map((hotel) => (
                                        <div
                                            key={hotel.hotel_id}
                                            className={`bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden relative cursor-pointer hover:shadow-purple-900/20 transition-all duration-300
                                                ${selectedHotelId === hotel.hotel_id ? 'ring-2 ring-purple-500 shadow-purple-500/30 transform scale-[1.02]' : ''}
                                            `}
                                            onClick={() => handleHotelClick(hotel.hotel_id, hotel.property.priceBreakdown.grossPrice.value, hotel)}
                                        >
                                            {selectedHotelId === hotel.hotel_id && (
                                                <div className="absolute -top-1 -right-1 z-10">
                                                    <div className="bg-purple-500 text-white p-2 rounded-bl-lg shadow-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <img
                                                    src={hotel.property.photoUrls[0]}
                                                    alt={hotel.property.name}
                                                    className="w-full h-36 object-cover"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-12"></div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-bold mb-1 text-white truncate">{hotel.property.name}</h3>
                                                <div className="flex items-center mb-2">
                                                    <div className="flex items-center bg-yellow-900 bg-opacity-40 px-2 py-0.5 rounded-full">
                                                        <FaStar className="text-yellow-400 mr-1" size={12} />
                                                        <span className="text-xs text-yellow-100 font-medium">
                                                            {hotel.property.reviewScore} 
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        ({hotel.property.reviewCount} reviews)
                                                    </span>
                                                </div>                                                <div className="text-xs text-gray-300 mb-2">                                                    <div className="flex justify-between items-center">
                                                        <span>Price per night:</span>
                                                        <span className="font-semibold text-white">
                                                            Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value * USD_TO_PKR_RATE)} PKR
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-700 p-2 mt-2 rounded-lg shadow-inner">
                                                        <span>Total ({daysOfStay || 1} nights):</span>
                                                        <div className="text-right">
                                                            <div className="font-bold text-green-400">
                                                                Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value * USD_TO_PKR_RATE) * (daysOfStay || 1)} PKR
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <a
                                                        href={getGoogleMapsLink(hotel.property.latitude, hotel.property.longitude)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex justify-center items-center bg-purple-600 text-white py-1 px-3 rounded-lg hover:bg-purple-700 transition-all text-xs font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        View on Map
                                                    </a>
                                                   
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-12 bg-gray-900 bg-opacity-70 border border-gray-800 rounded-lg p-6">
                                <div className="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Hotel Options Available</h3>
                                    <p className="text-gray-400 text-center">No hotel offers found within your budget of Rs. {searchResults?.hotelBudgetPKR || (hotelBudget * USD_TO_PKR_RATE)} PKR for {daysOfStay || 1} night(s)</p>
                                    <p className="text-gray-500 text-sm mt-2">Try increasing your hotel budget for more options</p>
                                </div>
                            </div>
                        )}
            
                        {!flightOffers.length && !hotelOffers.length && !loading && !error && (
                            <div className="flex flex-col items-center justify-center p-10 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-2xl font-bold text-gray-300 mb-2">No Matching Packages Found</h3>
                                <p className="text-gray-400 text-center max-w-lg">
                                    We couldn't find any flight and hotel combinations that match your criteria. 
                                    Please try adjusting your budget or dates for better results.
                                </p>
                                <button 
                                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                                    onClick={() => navigate(-1)}
                                >
                                    Return to Trip Planner
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        
            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black bg-opacity-95 shadow-lg py-3 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 md:mb-0">
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Flight Budget:</p>
                                    <p className="text-xs font-bold text-white text-right">Rs. {searchResults?.budgetPKR || Math.floor(budget * USD_TO_PKR_RATE)}</p>
                                
                                    <p className="text-xs text-gray-400">Selected Price:</p>                                    <p className="text-xs font-bold text-green-400 text-right">
                                        Rs. {totalSelectedPrice.flight ? Math.floor(totalSelectedPrice.flight * USD_TO_PKR_RATE) : "0"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Hotel Budget:</p>
                                    <p className="text-xs font-bold text-white text-right">Rs. {searchResults?.hotelBudgetPKR || Math.floor(hotelBudget * USD_TO_PKR_RATE)}</p>
                                    
                                    <p className="text-xs text-gray-400">Selected Hotel:</p>                                    <p className="text-xs font-bold text-green-400 text-right">
                                        Rs. {totalSelectedPrice.hotel ? Math.floor(totalSelectedPrice.hotel * 280 * (daysOfStay || 1)) : "0" }
                                        <span className="text-gray-500 text-xs"> ({daysOfStay || 1} nights)</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-800 p-2 rounded-lg">                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Total Budget:</p>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white">Rs. {Math.floor(calculateSavings().totalBudgetPKR)} PKR</p>
                                    </div>
                                    
                                    <p className="text-xs text-gray-400">Total Savings:</p>
                                    <div className="text-right">                                        <p className="text-xs font-bold text-green-400">
                                            Rs. {Math.floor(calculateSavings().amountPKR)} PKR ({calculateSavings().percentage}%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleAddToFavorites}
                                disabled={!selectedFlightId || !selectedHotelId}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium flex items-center
                                    ${(!selectedFlightId || !selectedHotelId)
                                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                Add to Favorites
                            </button>
                            
                            {selectedFlight && selectedHotel && (                                <BookTrip 
                                    tripData={{                                        flight: {
                                            token: selectedFlight.token || '',
                                            transactionId: selectedFlight.transactionId || '',
                                            flightNumber: selectedFlight.segments?.[0]?.legs?.[0]?.flightNumber || 
                                                         selectedFlight.segments?.[0]?.legs?.[0]?.flightInfo?.flightNumber || 
                                                         Math.random().toString(36).substring(2, 8),
                                            amount: totalSelectedPrice.flight || 0,
                                            departure: selectedFlight.segments?.[0]?.departureAirport?.name || 'N/A',
                                            arrival: selectedFlight.segments?.[0]?.arrivalAirport?.name || 'N/A',
                                            departureTime: selectedFlight.segments?.[0]?.departureTime || 'N/A',
                                            arrivalTime: selectedFlight.segments?.[0]?.arrivalTime || 'N/A',
                                            
                                            // Add return flight data for round trips only if it's actually a round trip
                                            returnDeparture: selectedFlight.isRoundTrip ? selectedFlight.segments?.[1]?.departureAirport?.name : null,
                                            returnArrival: selectedFlight.isRoundTrip ? selectedFlight.segments?.[1]?.arrivalAirport?.name : null,
                                            returnDepartureTime: selectedFlight.isRoundTrip ? selectedFlight.segments?.[1]?.departureTime : null,
                                            returnArrivalTime: selectedFlight.isRoundTrip ? selectedFlight.segments?.[1]?.arrivalTime : null,
                                            returnFlightNumber: selectedFlight.isRoundTrip ? 
                                                               (selectedFlight.segments?.[1]?.legs?.[0]?.flightNumber || 
                                                               selectedFlight.segments?.[1]?.legs?.[0]?.flightInfo?.flightNumber) : null,
                                
                                            // Add important metadata - respect the actual tripType
                                            isRoundTrip: selectedFlight.isRoundTrip,
                                            tripType: searchResults?.tripType || selectedFlight.tripType || 
                                                     (selectedFlight.isRoundTrip ? "ROUNDTRIP" : "ONE_WAY"),
                                            segments: selectedFlight.segments, // Pass the full segments data
                                            cabinClass: selectedFlight.segments?.[0]?.legs?.[0]?.cabinClass || searchResults.cabinClass || "Economy",
                                            
                                            // Airlines information - only include return airline for round trips
                                            airline: selectedFlight.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.name || 'N/A',
                                            returnAirline: selectedFlight.isRoundTrip ? 
                                                           selectedFlight.segments?.[1]?.legs?.[0]?.carriersData?.[0]?.name : null
                                        },
                                        hotel: {
                                            id: selectedHotel.hotel_id || '',
                                            name: selectedHotel.property?.name || 'N/A',
                                            location: selectedHotel.property?.address || 'N/A',
                                            pricePerDay: totalSelectedPrice.hotel || 0,
                                            totalPrice: (totalSelectedPrice.hotel || 0) * (daysOfStay || 1),
                                            daysOfStay: daysOfStay || 1,
                                            rating: selectedHotel.property?.reviewScore || 'N/A',
                                            // Add debug info that will appear in console logs
                                            _debug: {
                                                rawPrice: selectedHotel.property?.priceBreakdown?.grossPrice?.value,
                                                totalSelectedPriceHotel: totalSelectedPrice.hotel,
                                                daysOfStay: daysOfStay,
                                            }
                                        }
                                    }}
                                    buttonLabel={
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            Book This Package
                                        </span>
                                    }
                                    buttonClassName="px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                                    onSuccess={() => navigate('/my-trips')}
                                    searchResults={{
                                        ...searchResults,
                                        // Ensure tripType is correctly passed as well
                                        tripType: searchResults?.tripType || (selectedFlight.isRoundTrip ? "RETURN" : "ONE_WAY")
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        
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
                            <div className="h-full bg-gray-800 shadow-xl flex flex-col overflow-y-auto">
                                {/* Header */}
                                <div className="px-4 py-6 bg-gray-900 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">Flight Details</h2>
                                    <button 
                                        onClick={closeFlightDetailsSidebar}
                                        className="text-gray-400 hover:text-white focus:outline-none"
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
                                        <div className="bg-red-900 bg-opacity-60 border-l-4 border-red-500 text-red-100 p-4 mb-4 rounded">
                                            <p>{flightDetailsError}</p>
                                        </div>
                                    ) : flightDetailsData ? (
                                        <div className="space-y-6 text-gray-200">
                                            {/* Flight details content here */}
                                            <div className="bg-gray-700 p-3 rounded-md mb-4">
                                                <h2 className="text-xl font-semibold text-white">
                                                    {flightDetailsData.tripType === "ROUNDTRIP" ? "Round Trip" : "One Way"}
                                                </h2>
                                                <p className="text-gray-300">
                                                    {flightDetailsData.segments?.[0]?.departureAirport?.cityName} {flightDetailsData.tripType === "ROUNDTRIP" ? "↔" : "→"} {flightDetailsData.segments?.[0]?.arrivalAirport?.cityName}
                                                </p>
                                            </div>

                                            {/* Outbound Flight */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="font-semibold text-blue-300">Outbound Flight</h3>
                                                    <span className="bg-blue-900 text-blue-100 text-xs px-2 py-1 rounded-full">
                                                        {flightDetailsData.segments?.[0]?.legs?.[0]?.cabinClass || "Economy"}
                                                    </span>
                                                </div>
                                                
                                                {/* Carrier info */}
                                                <div className="flex items-center bg-gray-800 p-3 rounded-lg mb-3">
                                                    <div className="mr-3">
                                                        {flightDetailsData.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.logo && (
                                                            <img 
                                                                src={flightDetailsData.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.logo} 
                                                                alt="Airline" 
                                                                className="h-8 w-8 object-contain"
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{flightDetailsData.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.name || "Airline"}</p>
                                                        <p className="text-xs text-gray-400">Flight {flightDetailsData.segments?.[0]?.legs?.[0]?.flightNumber || 
                                                            flightDetailsData.segments?.[0]?.legs?.[0]?.flightInfo?.flightNumber}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Flight route details */}
                                                <div className="flex justify-between mb-4 border-b border-gray-700 pb-4">
                                                    <div>
                                                        <p className="text-lg font-bold">
                                                            {new Date(flightDetailsData.segments?.[0]?.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                        <p className="text-sm">{flightDetailsData.segments?.[0]?.departureAirport?.code}</p>
                                                        <p className="text-xs text-gray-400">{new Date(flightDetailsData.segments?.[0]?.departureTime).toLocaleDateString()}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-xs text-gray-400 mb-1">
                                                            {(() => {
                                                                try {
                                                                    const dep = new Date(flightDetailsData.segments?.[0]?.departureTime);
                                                                    const arr = new Date(flightDetailsData.segments?.[0]?.arrivalTime);
                                                                    const diff = (arr - dep) / (1000 * 60);
                                                                    const hours = Math.floor(diff / 60);
                                                                    const mins = Math.round(diff % 60);
                                                                    return `${hours}h ${mins}m`;
                                                                } catch(e) {
                                                                    return "N/A";
                                                                }
                                                            })()}
                                                        </div>
                                                        <div className="relative w-28">
                                                            <div className="border-t border-dashed border-gray-500 w-full absolute top-1/2"></div>
                                                            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 -mt-px">
                                                                <svg className="h-2 w-2 text-gray-400 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">
                                                            {new Date(flightDetailsData.segments?.[0]?.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                        <p className="text-sm">{flightDetailsData.segments?.[0]?.arrivalAirport?.code}</p>
                                                        <p className="text-xs text-gray-400">{new Date(flightDetailsData.segments?.[0]?.arrivalTime).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Return Flight - Only for round trips */}
                                            {flightDetailsData.tripType === "ROUNDTRIP" && flightDetailsData.segments?.length > 1 && (
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="font-semibold text-green-300">Return Flight</h3>
                                                        <span className="bg-green-900 text-green-100 text-xs px-2 py-1 rounded-full">
                                                            {flightDetailsData.segments?.[1]?.legs?.[0]?.cabinClass || "Economy"}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Carrier info */}
                                                    <div className="flex items-center bg-gray-800 p-3 rounded-lg mb-3">
                                                        <div className="mr-3">
                                                            {flightDetailsData.segments?.[1]?.legs?.[0]?.carriersData?.[0]?.logo && (
                                                                <img 
                                                                    src={flightDetailsData.segments?.[1]?.legs?.[0]?.carriersData?.[0]?.logo} 
                                                                    alt="Airline" 
                                                                    className="h-8 w-8 object-contain" 
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{flightDetailsData.segments?.[1]?.legs?.[0]?.carriersData?.[0]?.name || "Airline"}</p>
                                                            <p className="text-xs text-gray-400">Flight {flightDetailsData.segments?.[1]?.legs?.[0]?.flightNumber || 
                                                                flightDetailsData.segments?.[1]?.legs?.[0]?.flightInfo?.flightNumber}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Flight route details */}
                                                    <div className="flex justify-between mb-4 border-b border-gray-700 pb-4">
                                                        <div>
                                                            <p className="text-lg font-bold">
                                                                {new Date(flightDetailsData.segments?.[1]?.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                            <p className="text-sm">{flightDetailsData.segments?.[1]?.departureAirport?.code}</p>
                                                            <p className="text-xs text-gray-400">{new Date(flightDetailsData.segments?.[1]?.departureTime).toLocaleDateString()}</p>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-xs text-gray-400 mb-1">
                                                                {(() => {
                                                                    try {
                                                                        const dep = new Date(flightDetailsData.segments?.[1]?.departureTime);
                                                                        const arr = new Date(flightDetailsData.segments?.[1]?.arrivalTime);
                                                                        const diff = (arr - dep) / (1000 * 60);
                                                                        const hours = Math.floor(diff / 60);
                                                                        const mins = Math.round(diff % 60);
                                                                        return `${hours}h ${mins}m`;
                                                                    } catch(e) {
                                                                        return "N/A";
                                                                    }
                                                                })()}
                                                            </div>
                                                            <div className="relative w-28">
                                                                <div className="border-t border-dashed border-gray-500 w-full absolute top-1/2"></div>
                                                                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 -mt-px">
                                                                    <svg className="h-2 w-2 text-gray-400 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold">
                                                                {new Date(flightDetailsData.segments?.[1]?.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                            <p className="text-sm">{flightDetailsData.segments?.[1]?.arrivalAirport?.code}</p>
                                                            <p className="text-xs text-gray-400">{new Date(flightDetailsData.segments?.[1]?.arrivalTime).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Price section */}
                                            <div className="border-b border-gray-700 pb-4">
                                                <h2 className="text-xl font-semibold mb-2 text-gray-200">Price</h2>
                                                <p className="text-green-400 font-bold text-xl">
                                                    RS. {Math.floor(flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units * USD_TO_PKR_RATE)} PKR
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    ${flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units} USD
                                                </p>
                                            </div>

                                            {/* Baggage info if available */}
                                            {flightDetailsData.includedProducts?.segments && flightDetailsData.includedProducts.segments.length > 0 && (
                                                <div className="mb-4">
                                                    <h3 className="font-semibold text-gray-300 mb-2">Baggage Allowance</h3>
                                                    <div className="bg-gray-800 rounded-lg p-3">
                                                        {flightDetailsData.includedProducts.segments[0].map((item, index) => (
                                                            <div key={index} className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-400">{item.luggageType === "PERSONAL_ITEM" ? "Personal Item" : 
                                                                      item.luggageType === "HAND" ? "Cabin Baggage" : 
                                                                      "Checked Baggage"}</span>
                                                                <span className="text-white">
                                                                    {item.maxPiece} × {item.maxWeightPerPiece ? `${item.maxWeightPerPiece} ${item.massUnit}` : ""}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Select Flight Button */}
                                            <div className="pt-4">
                                                <button
                                                    onClick={() => {
                                                        const price = flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
                                                        handleFlightClick(flightDetailsToken, price, flightDetailsData);
                                                        closeFlightDetailsSidebar();
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                                                >
                                                    Select This Flight
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <p>No flight details available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetails;
