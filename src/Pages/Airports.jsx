import { useEffect, useState } from "react";

const API_URL = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport";
const API_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9"; // Replace if needed

export default function Airports() {
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [randomCountry, setRandomCountry] = useState("");

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

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-center mb-4">Find Airports</h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search airports by city, state, or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    Search
                </button>
            </form>

            {/* Loading & Error Handling */}
            {loading && <p className="text-gray-600 text-center">Loading airports...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Airport List */}
            {!loading && !error && airports.length > 0 ? (
                <ul className="space-y-3">
                    {airports.map((airport, index) => (
                        <li key={index} className="p-3 border rounded-md shadow-md">
                            <p className="font-semibold">
                                {airport.
                                    navigation?.
                                    localizedName || "Unknown Airport"}
                            </p>
                            <p className="text-gray-600">Code: {airport.skyId}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                !loading && <p className="text-gray-500 text-center">No airports found.</p>
            )}
        </div>
    );
}
