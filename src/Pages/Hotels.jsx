import React, { useState } from "react";
import { FaHotel, FaSearch, FaSpinner, FaStar } from "react-icons/fa";
import "../App.css";

export default function HotelSearch() {
    const [destination, setDestination] = useState("");
    const [destId, setDestId] = useState("");
    const [searchType, setSearchType] = useState("CITY");
    const [adults, setAdults] = useState(1);
    const [childrenAge, setChildrenAge] = useState([]);
    const [roomQty, setRoomQty] = useState(1);
    const [arrivalDate, setArrivalDate] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [hotelData, setHotelData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";

    // Fetch destination suggestions
    const fetchDestinationSuggestions = async (query) => {
        if (!query) {
            setDestinationSuggestions([]);
            return;
        }

        const url = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${query}`;
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
                setDestinationSuggestions(result.data);
            } else {
                setDestinationSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching destination suggestions:", error);
            setDestinationSuggestions([]);
        }
    };

    // Handle destination input change
    const handleDestinationChange = (e) => {
        const query = e.target.value;
        setDestination(query);
        fetchDestinationSuggestions(query);
    };

    // Handle selection of a destination suggestion
    const handleSuggestionClick = (suggestion) => {
        setDestination(suggestion.name);
        setDestId(suggestion.dest_id);
        setDestinationSuggestions([]);
    };

    // Handle hotel search
    const handleSearch = async () => {
        setLoading(true);
        setError("");
        setHotelData(null);

        if (!destId || !searchType || !arrivalDate || !departureDate) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        const url = new URL(`https://${API_HOST}/api/v1/hotels/searchHotels`);
        url.searchParams.append("dest_id", destId);
        url.searchParams.append("search_type", searchType);
        url.searchParams.append("adults", adults);
        url.searchParams.append("children_age", childrenAge.join(","));
        url.searchParams.append("room_qty", roomQty);
        url.searchParams.append("arrival_date", arrivalDate);
        url.searchParams.append("departure_date", departureDate);
        url.searchParams.append("page_number", 1);
        url.searchParams.append("units", "metric");
        url.searchParams.append("temperature_unit", "c");
        url.searchParams.append("languagecode", "en-us");
        url.searchParams.append("currency_code", "AED");

        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": API_HOST,
            },
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setHotelData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate Google Maps link
    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-900 to-gray-900 p-4">
            <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-4 animate-slideUp transition-all duration-500">
                <h1 className="text-3xl font-bold text-center mb-6">Find Your Perfect Hotel</h1>

                {/* Destination Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={destination}
                            onChange={handleDestinationChange}
                            placeholder="Enter destination"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {destinationSuggestions.length > 0 && (
                            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {destinationSuggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.dest_id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Search Type */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Type
                    </label>
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="CITY">City</option>
                        <option value="HOTEL">Hotel</option>
                    </select>
                </div>

                {/* Arrival Date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arrival Date
                    </label>
                    <input
                        type="date"
                        value={arrivalDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setArrivalDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Departure Date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departure Date
                    </label>
                    <input
                        type="date"
                        value={departureDate}
                        min={arrivalDate || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Adults */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adults
                    </label>
                    <input
                        type="number"
                        value={adults}
                        onChange={(e) => setAdults(e.target.value)}
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Children Ages */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Children Ages (comma-separated)
                    </label>
                    <input
                        type="text"
                        value={childrenAge.join(",")}
                        onChange={(e) => setChildrenAge(e.target.value.split(",").map(Number))}
                        placeholder="e.g., 5, 10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Room Quantity */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rooms
                    </label>
                    <input
                        type="number"
                        value={roomQty}
                        onChange={(e) => setRoomQty(e.target.value)}
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={loading || !destId || !arrivalDate || !departureDate}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                        loading || !destId || !arrivalDate || !departureDate
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                    }`}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="animate-spin h-5 w-5 mr-3" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <FaSearch className="mr-2" /> Find Hotels
                        </>
                    )}
                </button>

                {/* Error Message */}
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

                {/* Hotel Results */}
                {hotelData && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Hotel Options</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotelData.data.hotels.map((hotel) => (
                                <div key={hotel.hotel_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <img
                                        src={hotel.property.photoUrls[0]}
                                        alt={hotel.property.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold mb-2">{hotel.property.name}</h3>
                                        <div className="flex items-center mb-2">
                                            <FaStar className="text-yellow-500 mr-1" />
                                            <span className="text-gray-700">
                                                {hotel.property.reviewScore} ({hotel.property.reviewCount} reviews)
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">
                                            {Math.floor(hotel.property.priceBreakdown.grossPrice.value)}{" "}
                                            {hotel.property.priceBreakdown.grossPrice.currency}
                                        </p>
                                        <a
                                            href={getGoogleMapsLink(hotel.property.latitude, hotel.property.longitude)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View on Google Maps
                                        </a>
                                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all mt-4">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}