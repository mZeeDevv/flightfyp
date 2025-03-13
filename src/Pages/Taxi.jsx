import React, { useState } from 'react';
import { FaTaxi, FaExchangeAlt, FaSearch, FaSpinner } from 'react-icons/fa';

const Taxi = () => {
    const [pickUpPlaceId, setPickUpPlaceId] = useState('');
    const [dropOffPlaceId, setDropOffPlaceId] = useState('');
    const [pickUpDate, setPickUpDate] = useState('');
    const [pickUpTime, setPickUpTime] = useState('');
    const [taxiData, setTaxiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [pickUpQuery, setPickUpQuery] = useState('');
    const [dropOffQuery, setDropOffQuery] = useState('');
    const [pickUpSuggestions, setPickUpSuggestions] = useState([]);
    const [dropOffSuggestions, setDropOffSuggestions] = useState([]);
    const [isFetchingLocations, setIsFetchingLocations] = useState(false);

    // Fetch location suggestions from the API
    const fetchLocationSuggestions = async (query, setSuggestions) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        setIsFetchingLocations(true);
        const url = new URL('https://booking-com15.p.rapidapi.com/api/v1/taxi/searchLocation');
        url.searchParams.append('query', query);

        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'c78b8b63cemshd029e4bc8339cc2p13203djsncc173c1c68c4',
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setSuggestions(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsFetchingLocations(false);
        }
    };

    // Handle pick-up location search
    const handlePickUpSearch = async (e) => {
        const query = e.target.value;
        setPickUpQuery(query);
        await fetchLocationSuggestions(query, setPickUpSuggestions);
    };

    // Handle drop-off location search
    const handleDropOffSearch = async (e) => {
        const query = e.target.value;
        setDropOffQuery(query);
        await fetchLocationSuggestions(query, setDropOffSuggestions);
    };

    // Handle taxi search
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = new URL('https://booking-com15.p.rapidapi.com/api/v1/taxi/searchTaxi');
        url.searchParams.append('pick_up_place_id', pickUpPlaceId);
        url.searchParams.append('drop_off_place_id', dropOffPlaceId);
        url.searchParams.append('pick_up_date', pickUpDate);
        url.searchParams.append('pick_up_time', pickUpTime);
        url.searchParams.append('currency_code', 'INR');

        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'c78b8b63cemshd029e4bc8339cc2p13203djsncc173c1c68c4',
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setTaxiData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-900 to-gray-900">
            {/* Header Section */}
            <div className="text-center text-white mb-8 animate-fadeIn">
                <h1 className="text-5xl font-bold mb-4">
                    Book Your Taxi Ride
                </h1>
                <h2 className="text-2xl">
                    Find the <span className="text-yellow-300 font-bold animate-pulse">Best Deals</span> for Your Journey
                </h2>
            </div>

            {/* Form Section */}
            <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-4 animate-slideUp transition-all duration-500">
                <form onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                        {/* Pick-up Location Field */}
                        <div className="relative lg:col-span-5 md:col-span-2 flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pick-up Location
                            </label>
                            <input
                                type="text"
                                value={pickUpQuery}
                                onChange={handlePickUpSearch}
                                placeholder="Enter pick-up location"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {isFetchingLocations && (
                                <div className="absolute top-12 right-2">
                                    <FaSpinner className="animate-spin text-gray-500" />
                                </div>
                            )}
                            {pickUpSuggestions.length > 0 && (
                                <ul className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {pickUpSuggestions.map((location) => (
                                        <li
                                            key={location.googlePlaceId}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setPickUpPlaceId(location.googlePlaceId);
                                                setPickUpQuery(location.name);
                                                setPickUpSuggestions([]);
                                            }}
                                        >
                                            {location.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Drop-off Location Field */}
                        <div className="relative lg:col-span-5 md:col-span-2 flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Drop-off Location
                            </label>
                            <input
                                type="text"
                                value={dropOffQuery}
                                onChange={handleDropOffSearch}
                                placeholder="Enter drop-off location"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {isFetchingLocations && (
                                <div className="absolute top-12 right-2">
                                    <FaSpinner className="animate-spin text-gray-500" />
                                </div>
                            )}
                            {dropOffSuggestions.length > 0 && (
                                <ul className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {dropOffSuggestions.map((location) => (
                                        <li
                                            key={location.googlePlaceId}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setDropOffPlaceId(location.googlePlaceId);
                                                setDropOffQuery(location.name);
                                                setDropOffSuggestions([]);
                                            }}
                                        >
                                            {location.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Date and Time Fields */}
                        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pick-up Date
                                </label>
                                <input
                                    type="date"
                                    value={pickUpDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setPickUpDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pick-up Time
                                </label>
                                <input
                                    type="time"
                                    value={pickUpTime}
                                    onChange={(e) => setPickUpTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="lg:col-span-3 flex items-end">
                            <button
                                type="submit"
                                disabled={loading || !pickUpPlaceId || !dropOffPlaceId}
                                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                                    loading || !pickUpPlaceId || !dropOffPlaceId
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
                                        <FaSearch className="mr-2" /> Find Taxi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

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

                {/* Taxi Data Display */}
                {taxiData && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Taxi Options</h2>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(taxiData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Taxi;