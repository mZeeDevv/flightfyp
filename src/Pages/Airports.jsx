import { useEffect, useState } from "react";
import { FaPlane, FaSearch, FaMapMarkerAlt, FaGlobe, FaInfoCircle } from "react-icons/fa";

const API_URL = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport";
const API_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9"; // Replace if needed

export default function Airports() {
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [randomCountry, setRandomCountry] = useState("");
    const [filterType, setFilterType] = useState("all");
    
    // Random countries for initial load
    const countryOptions = ["Pakistan", "USA", "UK", "Germany", "France", "Canada"];

    useEffect(() => {
        // Pick a random country each time component loads
        const selectedCountry = countryOptions[Math.floor(Math.random() * countryOptions.length)];
        setRandomCountry(selectedCountry);

        fetchAirports(selectedCountry);
    }, []);

    const fetchAirports = async (query) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}?query=${query}`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": "sky-scrapper.p.rapidapi.com",
                },
            });

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const result = await response.json();
            console.log("API Response:", result);

            if (result?.data && Array.isArray(result.data)) {
                setAirports(result.data);
            } else {
                throw new Error("Invalid response format: 'data' key missing or not an array.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim() === "") return;
        fetchAirports(searchQuery);
    };

    // Filter airports based on the selected filter
    const filteredAirports = airports.filter(airport => {
        if (filterType === "all") return true;
        // You can add more filter types here based on airport properties
        // This is a placeholder since the actual data structure might vary
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-10 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                        <FaPlane className="text-blue-600 mr-3 transform rotate-45" />
                        Global Airport Directory
                    </h1>
                    <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-4"></div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Search for airports worldwide by city, country, or airport name. 
                        Currently showing results for <span className="font-semibold text-blue-700">{randomCountry}</span>.
                    </p>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-grow relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                placeholder="Search airports by city, country, or airport name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center shadow-md"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Searching...
                                </>
                            ) : (
                                <>Find Airports</>
                            )}
                        </button>
                    </form>
                    
                    {/* Filter options */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-gray-700 mr-2">Filter:</span>
                        <button 
                            onClick={() => setFilterType("all")} 
                            className={`px-4 py-1 rounded-full text-sm ${filterType === "all" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            All Airports
                        </button>
                        <button 
                            onClick={() => setFilterType("international")} 
                            className={`px-4 py-1 rounded-full text-sm ${filterType === "international" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            International
                        </button>
                        <button 
                            onClick={() => setFilterType("domestic")} 
                            className={`px-4 py-1 rounded-full text-sm ${filterType === "domestic" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            Domestic
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Finding airports around the world...</p>
                    </div>
                )}
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8">
                        <div className="flex items-center">
                            <FaInfoCircle className="mr-2" />
                            <span>Error: {error}</span>
                        </div>
                        <p className="mt-2 text-sm">
                            Please try a different search term or check your connection.
                        </p>
                    </div>
                )}

                {/* Results Count */}
                {!loading && !error && (
                    <div className="text-gray-600 mb-6">
                        Found {filteredAirports.length} airport{filteredAirports.length !== 1 ? 's' : ''} 
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                )}

                {/* Airport Cards Grid */}
                {!loading && !error && filteredAirports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAirports.map((airport, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
                            >
                                {/* Airport Header with Color Bar */}
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                                
                                <div className="p-6">
                                    {/* Airport Name */}
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {airport.navigation?.localizedName || "Unknown Airport"}
                                        </h3>
                                        <div className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-xs">
                                            {airport.skyId || "N/A"}
                                        </div>
                                    </div>
                                    
                                    {/* Airport Details */}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center text-gray-600">
                                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                                            <span>{airport.navigation?.translationInfo?.destinationType || "Airport"}</span>
                                        </div>
                                        
                                        <div className="flex items-center text-gray-600">
                                            <FaGlobe className="mr-2 text-blue-500" />
                                            <span>{airport.navigation?.country?.name || "Unknown Country"}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Call to Action */}
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-md transition-colors duration-300 flex items-center justify-center">
                                            <FaPlane className="mr-2" /> View Flights
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && (
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <FaPlane className="text-gray-300 text-5xl mx-auto mb-4" />
                            <p className="text-gray-500 text-xl">No airports found matching your search criteria.</p>
                            <p className="text-gray-400 mt-2">Try searching for a different city or country name.</p>
                        </div>
                    )
                )}

                {/* Info Section */}
                <div className="max-w-4xl mx-auto mt-16 p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <h3 className="text-xl font-bold text-blue-800 mb-3">About Our Airport Database</h3>
                    <p className="text-gray-700 mb-4">
                        Our comprehensive airport database includes information on major airports worldwide.
                        Search results provide airport codes, locations, and other relevant details to help plan your journey.
                    </p>
                    <div className="flex items-center text-blue-700">
                        <FaInfoCircle className="mr-2" />
                        <span>For the most accurate and up-to-date information, always verify with the official airport website.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
