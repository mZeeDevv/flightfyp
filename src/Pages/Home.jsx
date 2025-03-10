import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlane, FaExchangeAlt, FaSearch } from "react-icons/fa";
import Cheap from "../Components/Cheap";
import About from "../Components/About";
import Newsletter from "../Components/Mail";
import "../App.css";
import bg from "../assets/254381.webp";

export default function Home() {
    const [tripType, setTripType] = useState("RETURN"); // Default to return
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [cabinClass, setCabinClass] = useState("ECONOMY");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showContent, setShowContent] = useState(false);
    const [dynamicHeading, setDynamicHeading] = useState("Flight"); // Dynamic heading state
    const navigate = useNavigate();

    const RAPIDAPI_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9";
    const API_HOST = "booking-com15.p.rapidapi.com";

    // Animation on page load
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true); // Show content after animation
        }, 3000); // Adjust timing based on animation duration

        return () => clearTimeout(timer);
    }, []);

    // Dynamic heading animation (word-by-word replacement)
    useEffect(() => {
        const headings = ["Flight", "Car", "Hotel"];
        let index = 0;

        const interval = setInterval(() => {
            setDynamicHeading(headings[index]);
            index = (index + 1) % headings.length; // Cycle through headings
        }, 3000); // Change word every 3 seconds

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    const fetchAirportId = async (city) => {
        if (!city) return null;

        const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${city}`;
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
                return result.data[0].id;
            } else {
                throw new Error(`No airport found for "${city}"`);
            }
        } catch (error) {
            console.error(`Error fetching airport for "${city}":`, error);
            setError(`Could not find an airport for "${city}"`);
            return null;
        }
    };

    const handleSearch = async () => {
        setLoading(true); // Start loading effect
        setError("");

        const fromId = await fetchAirportId(from);
        const toId = await fetchAirportId(to);

        if (fromId && toId) {
            navigate("/flights", {
                state: {
                    fromId,
                    toId,
                    departureDate,
                    returnDate: tripType === "RETURN" ? returnDate : undefined, // Exclude return date if One-way
                    cabinClass,
                },
            });
        } else {
            setError("Please enter valid departure and arrival cities.");
        }

        setLoading(false); // Stop loading effect
    };

    // New function to handle input swapping
    const handleSwapLocations = () => {
        setFrom(to);
        setTo(from);
    };

    // Function to check if form is valid
    const isFormValid = () => {
        return from && to && departureDate && (tripType === "ONE_WAY" || returnDate);
    };

    return (
        <>
            {!showContent ? (
                // Enhanced plane animation
                <div className="plane-animation flex items-center justify-center h-screen bg-gradient-to-r from-blue-900 to-gray-900">
                    <FaPlane className="plane-icon text-6xl text-white animate-pulse" />
                    <div className="mt-4 text-white text-xl font-bold animate-pulse">Loading amazing flight deals...</div>
                </div>
            ) : (
                // Enhanced homepage content
                <div className="min-h-screen flex flex-col items-center justify-center bg-no-repeat bg-cover bg-fixed"
                    style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${bg})` }}>
                    
                    <div className="text-center text-white mb-8 animate-fadeIn">
                        <h1 className="text-5xl font-bold mb-4">
                            Travel The World With Ease
                        </h1>
                        <h2 className="text-2xl">
                            Book Your{" "}
                            <span className="inline-block text-yellow-300 font-bold animate-pulse">
                                {dynamicHeading}
                            </span>{" "}
                            At Unbeatable Prices
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                            {/* From and To fields with swap button */}
                            <div className="relative lg:col-span-5 md:col-span-2 flex">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        From
                                    </label>
                                    <input
                                        type="text"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        placeholder="Departure city"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
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
                                        onChange={(e) => setTo(e.target.value)}
                                        placeholder="Arrival city"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Date fields */}
                            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
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

                            {/* Cabin class and search button */}
                            <div className="lg:col-span-3 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cabin Class
                                    </label>
                                    <select
                                        value={cabinClass}
                                        onChange={(e) => setCabinClass(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="ECONOMY">Economy</option>
                                        <option value="PREMIUM_ECONOMY">Premium Economy</option>
                                        <option value="BUSINESS">Business</option>
                                        <option value="FIRST">First Class</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !isFormValid()}
                                    className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                                        isFormValid() && !loading
                                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
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
                                            <FaSearch className="mr-2" /> Find Flights
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

                        {/* Travel tips */}
                        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-blue-800 font-medium mb-2">Travel Tips</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Book 3-4 weeks in advance for the best prices</li>
                                <li>• Tuesday and Wednesday flights are often cheaper</li>
                                <li>• Be flexible with your travel dates for better deals</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            <About />
            <Cheap />
            <Newsletter />
        </>
    );
}
