import React, { useState } from 'react';
import { FaSearch } from "react-icons/fa";
import bg from "../assets/254381.webp";

const BudgetPlanner = () => {
    const [userType, setUserType] = useState('PROFESSIONAL');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [budget, setBudget] = useState({
        total: '',
        flight: '',
        hotel: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [flightResults, setFlightResults] = useState([]);
    const [hotelResults, setHotelResults] = useState([]);

    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";

    // Debounce function
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Fetch suggestions for flights and hotels
    const fetchSuggestions = async (query, setSuggestions, type) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        const url = `https://${API_HOST}/api/v1/${type}/searchDestination?query=${query}`;
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
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
        }
    };

    const debouncedFetchFromSuggestions = debounce((query) => {
        fetchSuggestions(query, setFromSuggestions, 'flights');
    }, 300);

    const debouncedFetchToSuggestions = debounce((query) => {
        fetchSuggestions(query, setToSuggestions, 'flights');
    }, 300);

    const handleFromChange = (e) => {
        setFrom(e.target.value);
        debouncedFetchFromSuggestions(e.target.value);
    };

    const handleToChange = (e) => {
        setTo(e.target.value);
        debouncedFetchToSuggestions(e.target.value);
    };

    const handleBudgetChange = (e) => {
        const { name, value } = e.target;
        setBudget(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Fetch flights
    const fetchFlights = async (fromId, toId) => {
        const url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}`;
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
                setFlightResults(result.data);
            }
        } catch (error) {
            console.error("Error fetching flights:", error);
            setFlightResults([]);
        }
    };

    // Fetch hotels
    const fetchHotels = async (destinationId) => {
        const url = `https://${API_HOST}/api/v1/hotels/searchHotels?destinationId=${destinationId}`;
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
                setHotelResults(result.data);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
            setHotelResults([]);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError('');

        try {
            const fromId = await fetchAirportId(from);
            const toId = await fetchAirportId(to);

            if (!fromId || !toId) {
                setError('Please enter valid departure and arrival cities.');
                return;
            }

            // Fetch flights and hotels
            await fetchFlights(fromId, toId);
            await fetchHotels(toId);

        } catch (error) {
            setError('An error occurred while planning your budget.');
        } finally {
            setLoading(false);
        }
    };

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
            return result?.data?.[0]?.id || null;
        } catch (error) {
            console.error(`Error fetching airport for "${city}":`, error);
            return null;
        }
    };

    return (
        <div className="min-h-screen bg-no-repeat bg-cover bg-fixed"
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${bg})` }}>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl">
                    <h1 className="text-3xl font-bold mb-6">Budget Planner</h1>

                    <div className="grid gap-6">
                        {/* User Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Travel Category
                            </label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                            >
                                <option value="PROFESSIONAL">Professional</option>
                                <option value="VISITOR">Visitor</option>
                                <option value="WORKER">Worker</option>
                            </select>
                        </div>

                        {/* Location Inputs */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From
                                </label>
                                <input
                                    type="text"
                                    value={from}
                                    onChange={handleFromChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Departure city"
                                />
                                {fromSuggestions.length > 0 && (
                                    <ul className="mt-1 border rounded-lg shadow-lg bg-white">
                                        {fromSuggestions.map((suggestion) => (
                                            <li
                                                key={suggestion.id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setFrom(suggestion.name);
                                                    setFromSuggestions([]);
                                                }}
                                            >
                                                {suggestion.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To
                                </label>
                                <input
                                    type="text"
                                    value={to}
                                    onChange={handleToChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Arrival city"
                                />
                                {toSuggestions.length > 0 && (
                                    <ul className="mt-1 border rounded-lg shadow-lg bg-white">
                                        {toSuggestions.map((suggestion) => (
                                            <li
                                                key={suggestion.id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setTo(suggestion.name);
                                                    setToSuggestions([]);
                                                }}
                                            >
                                                {suggestion.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Budget Inputs */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Budget
                                </label>
                                <input
                                    type="number"
                                    name="total"
                                    value={budget.total}
                                    onChange={handleBudgetChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Enter total budget"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Flight Budget
                                </label>
                                <input
                                    type="number"
                                    name="flight"
                                    value={budget.flight}
                                    onChange={handleBudgetChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Enter flight budget"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hotel Budget
                                </label>
                                <input
                                    type="number"
                                    name="hotel"
                                    value={budget.hotel}
                                    onChange={handleBudgetChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Enter hotel budget"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className={`flex items-center justify-center p-3 rounded-lg text-white font-semibold ${
                                loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? (
                                'Planning...'
                            ) : (
                                <>
                                    <FaSearch className="mr-2" /> Plan Budget
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Flight Results */}
                        {flightResults.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-xl font-semibold mb-4">Flight Results</h2>
                                <div className="space-y-4">
                                    {flightResults.map((flight) => (
                                        <div key={flight.id} className="p-4 border rounded-lg">
                                            <p><strong>Airline:</strong> {flight.airline}</p>
                                            <p><strong>Price:</strong> ${flight.price}</p>
                                            <p><strong>Departure:</strong> {flight.departureTime}</p>
                                            <p><strong>Arrival:</strong> {flight.arrivalTime}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotel Results */}
                        {hotelResults.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-xl font-semibold mb-4">Hotel Results</h2>
                                <div className="space-y-4">
                                    {hotelResults.map((hotel) => (
                                        <div key={hotel.id} className="p-4 border rounded-lg">
                                            <p><strong>Name:</strong> {hotel.name}</p>
                                            <p><strong>Price:</strong> ${hotel.price}</p>
                                            <p><strong>Rating:</strong> {hotel.rating}</p>
                                            <p><strong>Address:</strong> {hotel.address}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetPlanner;