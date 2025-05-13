import React, { useState } from "react";
import { FaExchangeAlt, FaSearch } from "react-icons/fa";
import TripDetails from "./TripDetails"; // Import the TripDetails component
import bg from "../assets/254381.webp";

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

const BudgetPlanner = () => {
   
    const [tripType, setTripType] = useState("RETURN");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [travelCategory, setTravelCategory] = useState("PROFESSIONAL");
    const [cabinClass, setCabinClass] = useState("ECONOMY");
    const [budget, setBudget] = useState({
        total: "",
        flight: "",
        hotel: ""
    });
    const [daysOfStay, setDaysOfStay] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState(null); // State to store search results
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);

    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";

    // Mapping of travel category to cabin class options
    const cabinClassOptions = {
        PROFESSIONAL: ["BUSINESS", "FIRST"],
        VISITOR: ["ECONOMY", "PREMIUM_ECONOMY"],
        WORKER: ["ECONOMY"],
    };

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
        if (!query) {
            setSuggestions([]);
            return;
        }

        const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${query}`;
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
                setSuggestions(result.data);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
        }
    };

    // Debounced fetch for "From" field
    const debouncedFetchFromSuggestions = debounce((query) => {
        fetchSuggestions(query, setFromSuggestions);
    }, 300);

    // Debounced fetch for "To" field
    const debouncedFetchToSuggestions = debounce((query) => {
        fetchSuggestions(query, setToSuggestions);
    }, 300);

    // Handle "From" input change
    const handleFromChange = (e) => {
        const query = e.target.value;
        setFrom(query);
        debouncedFetchFromSuggestions(query);
    };

    // Handle "To" input change
    const handleToChange = (e) => {
        const query = e.target.value;
        setTo(query);
        debouncedFetchToSuggestions(query);
    };    // Handle selection of a suggestion
    const handleSuggestionClick = (suggestion, setField, setSuggestions) => {
        console.log('Selected suggestion:', suggestion);
        console.log('Suggestion name:', suggestion.name);
        console.log('Suggestion ID:', suggestion.id);
        setField(suggestion.name); // Set the input field value
        setSuggestions([]); // Clear suggestions
    };// Add new function to handle flight selection
    const handleFlightSelection = (flightId, flightPrice, priceDetails) => {
        setSelectedFlight(flightId);
        // If we receive price details object with PKR, use it; otherwise convert USD to PKR
        const pricePKR = priceDetails?.pkr || (flightPrice * USD_TO_PKR_RATE);
        setBudget(prev => ({
            ...prev,
            flight: pricePKR
        }));
    };

    // Add new function to handle hotel selection
    const handleHotelSelection = (hotelId, hotelPrice, priceDetails) => {
        setSelectedHotel(hotelId);
        // If we receive price details object with PKR, use it; otherwise convert USD to PKR
        const pricePKR = priceDetails?.pkr || (hotelPrice * USD_TO_PKR_RATE);
        setBudget(prev => ({
            ...prev,
            hotel: pricePKR
        }));
    };

    // Modify budget input to show total budget
    const handleBudgetChange = (e) => {
        setBudget(prev => ({
            ...prev,
            total: e.target.value
        }));
    };

    // Add new function to handle hotel budget change
    const handleHotelBudgetChange = (e) => {
        setBudget(prev => ({
            ...prev,
            hotel: e.target.value
        }));
    };

    // Handle search
    const handleSearch = async () => {
        setLoading(true); // Start loading effect
        setError("");

        // Reset selected flight and hotel
        setSelectedFlight(null);
        setSelectedHotel(null);
        setBudget(prev => ({ ...prev, flight: "" }));

        // Calculate returnDate if it's not provided
        let calculatedReturnDate = returnDate;
        if (!returnDate && daysOfStay && departureDate) {
            const departure = new Date(departureDate);
            departure.setDate(departure.getDate() + parseInt(daysOfStay, 10));
            calculatedReturnDate = departure.toISOString().split("T")[0]; // Format as yyyy-mm-dd
        }

        if (!calculatedReturnDate && tripType === "RETURN") {
            setError("Please provide a return date or days of stay.");
            setLoading(false);
            return;
        }

        const fromId = await fetchAirportId(from);
        const toId = await fetchAirportId(to);        if (fromId && toId) {
            // Convert PKR budgets to USD for API calls, but keep original PKR values for display
            const flightBudgetUSD = Math.floor(parseInt(budget.total) / USD_TO_PKR_RATE);
            const hotelBudgetUSD = Math.floor(parseInt(budget.hotel) / USD_TO_PKR_RATE);
            
            // Prepare search results
            const searchResults = {
                fromId,
                toId,
                departureDate,
                returnDate: calculatedReturnDate, // Use calculated returnDate
                cabinClass,
                budget: flightBudgetUSD, // USD budget for API
                hotelBudget: hotelBudgetUSD, // USD hotel budget for API
                budgetPKR: budget.total, // Original PKR budget for display
                hotelBudgetPKR: budget.hotel, // Original PKR hotel budget for display
                selectedFlight,
                selectedHotel,
                daysOfStay,
                travelCategory,
                USD_TO_PKR_RATE, // Pass conversion rate to child components
            };

            // Set search results to state
            setSearchResults(searchResults);        } else {
            if (!fromId && !toId) {
                setError("Please enter valid departure and arrival cities. Both city names could not be recognized.");
            } else if (!fromId) {
                setError(`Could not find an airport for departure city "${from}". Please check spelling or try another city.`);
            } else if (!toId) {
                setError(`Could not find an airport for arrival city "${to}". Please check spelling or try another city.`);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
            console.log("Search failed with fromId:", fromId, "and toId:", toId);
        }

        setLoading(false); // Stop loading effect
    };// Fetch airport ID for a city
    const fetchAirportId = async (city) => {
        if (!city) return null;

        // Handle special cases directly
        if (city.includes("Islamabad") || city === "ISB") {
            console.log("Special case: Using Islamabad International Airport ID directly");
            return "ISB.AIRPORT";
        }
        if (city.includes("Lahore") || city === "LHE") {
            console.log("Special case: Using Lahore International Airport ID directly");
            return "LHE.AIRPORT";
        }
        if (city.includes("Karachi") || city === "KHI") {
            console.log("Special case: Using Karachi International Airport ID directly");
            return "KHI.AIRPORT";
        }

        console.log(`Fetching airport ID for city: "${city}"`);
        const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(city)}`;
        console.log(`API request URL: ${url}`);
        
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
            console.log(`API response for "${city}":`, result);            if (result?.data?.length > 0) {
                console.log(`Found airport ID for "${city}": ${result.data[0].id}`);
                return result.data[0].id;
            } else {
                console.log(`No airport found for "${city}" in API response`);
                
                // Try to extract a city name if the input might be an airport name
                const cityMatch = city.match(/^(.*?)\s+(?:International\s+)?Airport/i);
                if (cityMatch && cityMatch[1]) {
                    const extractedCity = cityMatch[1].trim();
                    console.log(`Trying with extracted city name: "${extractedCity}"`);
                    
                    const secondUrl = `https://${API_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(extractedCity)}`;
                    console.log(`Second attempt API request URL: ${secondUrl}`);
                    
                    const secondResponse = await fetch(secondUrl, options);
                    const secondResult = await secondResponse.json();
                    console.log(`Second API response for "${extractedCity}":`, secondResult);
                    
                    if (secondResult?.data?.length > 0) {
                        console.log(`Found airport ID for extracted city "${extractedCity}": ${secondResult.data[0].id}`);
                        return secondResult.data[0].id;
                    }
                }
                  console.log(`All attempts failed to find airport for "${city}"`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching airport ID for "${city}":`, error);
            return null;
        }
    };

    // Handle input swapping
    const handleSwapLocations = () => {
        setFrom(to);
        setTo(from);
    };

    // Function to check if form is valid
    const isFormValid = () => {
        return (
            from &&
            to &&
            departureDate &&
            (tripType === "ONE_WAY" || returnDate || daysOfStay) && // Allow daysOfStay as an alternative
            budget.total &&
            budget.hotel && // Make sure hotel budget is provided
            daysOfStay
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-no-repeat bg-cover bg-fixed"
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${bg})` }}>
            
            <div className="text-center text-white mb-8 animate-fadeIn">
                <h1 className="text-5xl font-bold mb-4">
                    Plan Your Trip Within Budget
                </h1>
                <h2 className="text-2xl">
                    Find the best flights, hotels, and taxis that fit your budget
                </h2>
            </div>
            
            <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-4 animate-slideUp transition-all duration-500">
                {/* Trip Type Selection - Styled as tabs */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex p-1 bg-gray-200 rounded-lg">
                        <button
                            onClick={() => setTripType("ONE_WAY")}
                            className={`px-6 py-2 rounded-md transition-all duration-200 ${
                                tripType === "ONE_WAY" 
                                ? "bg-blue-600 text-white shadow-md" 
                                : "bg-transparent text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            One-way
                        </button>
                        <button
                            onClick={() => setTripType("RETURN")}
                            className={`px-6 py-2 rounded-md transition-all duration-200 ${
                                tripType === "RETURN" 
                                ? "bg-blue-600 text-white shadow-md" 
                                : "bg-transparent text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Return
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* From and To fields with swap button */}
                    <div className="relative md:col-span-6 flex">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From
                            </label>
                            <input
                                type="text"
                                value={from}
                                onChange={handleFromChange}
                                placeholder="Departure city"
                                className="w-full px-4 py-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {fromSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {fromSuggestions.map((suggestion) => (
                                        <li
                                            key={suggestion.id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleSuggestionClick(suggestion, setFrom, setFromSuggestions)}
                                        >
                                            {suggestion.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button 
                            onClick={handleSwapLocations}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all z-10"
                            title="Swap locations"
                        >
                            <FaExchangeAlt />
                        </button>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To
                            </label>
                            <input
                                type="text"
                                value={to}
                                onChange={handleToChange}
                                placeholder="Arrival city"
                                className="w-full px-4 py-3 border border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {toSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {toSuggestions.map((suggestion) => (
                                        <li
                                            key={suggestion.id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleSuggestionClick(suggestion, setTo, setToSuggestions)}
                                        >
                                            {suggestion.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Date fields */}
                    <div className="md:col-span-6 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Departure Date
                            </label>
                            <input
                                type="date"
                                value={departureDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Date
                            </label>
                            <input
                                type="date"
                                value={returnDate}
                                min={departureDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setReturnDate(e.target.value)}
                                disabled={tripType === "ONE_WAY"}
                                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    tripType === "ONE_WAY"
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                        : "border-gray-300"
                                }`}
                            />
                        </div>
                    </div>

                    {/* Travel Category and Cabin Class */}
                    <div className="md:col-span-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Travel Category
                            </label>
                            <select
                                value={travelCategory}
                                onChange={(e) => setTravelCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="PROFESSIONAL">Professional</option>
                                <option value="VISITOR">Visitor</option>
                                <option value="WORKER">Worker</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cabin Class
                            </label>
                            <select
                                value={cabinClass}
                                onChange={(e) => setCabinClass(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                {cabinClassOptions[travelCategory].map((option) => (
                                    <option key={option} value={option}>
                                        {option.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Combined Budget and Days of Stay row */}
                    <div className="md:col-span-8 grid grid-cols-3 gap-4">                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Flight Budget (PKR)
                            </label>
                            <input
                                type="number"
                                value={budget.total}
                                onChange={handleBudgetChange}
                                placeholder="Total Budget in PKR"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hotel Budget (PKR)
                            </label>
                            <input
                                type="number"
                                value={budget.hotel}
                                onChange={handleHotelBudgetChange}
                                placeholder="Hotel Budget in PKR"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Days of Stay
                            </label>
                            <input
                                type="number"
                                value={daysOfStay}
                                onChange={(e) => setDaysOfStay(e.target.value)}
                                placeholder="Enter days"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <div className="md:col-span-12 mt-2">
                        <button
                            onClick={handleSearch}
                            disabled={loading || !isFormValid()}
                            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                                isFormValid() && !loading
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 mr-3 text-white"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <FaSearch className="mr-2" /> Find Best Travel Options
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error message with better styling */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                        <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            {error}
                        </p>
                    </div>
                )}

                {/* Travel tips - improved appearance */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200 shadow-inner">
                    <h3 className="text-blue-800 font-semibold mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Travel Tips & Recommendations
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-2">
                        <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Book 3-4 weeks in advance for the best prices
                        </li>
                        <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Tuesday and Wednesday flights are often cheaper
                        </li>
                        <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Be flexible with your travel dates for better deals
                        </li>
                    </ul>
                </div>
            </div>
            {searchResults && (
                <TripDetails 
                    searchResults={searchResults} 
                    onFlightSelect={handleFlightSelection}
                    onHotelSelect={handleHotelSelection}
                />
            )}
        </div>
    );
};

export default BudgetPlanner;