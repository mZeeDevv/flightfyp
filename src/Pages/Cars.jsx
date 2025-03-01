import { useEffect, useState } from "react";

const API_URL = "https://sky-scrapper.p.rapidapi.com/api/v1/cars/searchLocation";
const API_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9"; // Replace if needed

export default function Cars() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [randomCity, setRandomCity] = useState("");

    // Random cities for initial load
    const cityOptions = ["New York", "Los Angeles", "Paris", "London", "Berlin", "Toronto"];

    useEffect(() => {
        // Pick a random city each time component loads
        const selectedCity = cityOptions[Math.floor(Math.random() * cityOptions.length)];
        setRandomCity(selectedCity);

        fetchCars(selectedCity);
    }, []);

    const fetchCars = async (query) => {
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
            console.log("Car Rentals API Response:", result);

            if (result?.data && Array.isArray(result.data)) {
                setCars(result.data);
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
        fetchCars(searchQuery);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-center mb-4">Find Car Rental Locations</h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search for car rental locations..."
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
            {loading && <p className="text-gray-600 text-center">Loading car rental locations...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Car Rental List */}
            {!loading && !error && cars.length > 0 ? (
                <ul className="space-y-3">
                    {cars.map((car, index) => (
                        <li key={index} className="p-3 border rounded-md shadow-md">
                            <p>Services: {car.
                                hierarchy}</p>
                            <p>Class: {car.class}</p>
                            <p>Entity Name: {car.entity_name}</p>
                            {car.location ? (
                                <p>
                                    Location:{" "}
                                    <a
                                        href={`https://www.google.com/maps?q=${car.location}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        View on Google Maps
                                    </a>
                                </p>
                            ) : (
                                <p className="text-gray-500">Location not available</p>
                            )}

                        </li>
                    ))}
                </ul>
            ) : (
                !loading && <p className="text-gray-500 text-center">No rental locations found.</p>
            )}
        </div>
    );
}
