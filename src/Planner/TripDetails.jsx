import React, { useEffect, useState } from "react";
import Spinner from '../Components/Spinner';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";

const TripDetails = ({ searchResults }) => {
    const { fromId, toId, departureDate, returnDate, cabinClass, budget, daysOfStay } = searchResults;
    const [flightOffers, setFlightOffers] = useState([]);
    const [hotelOffers, setHotelOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch flights
    const fetchFlights = async () => {
        if (!fromId || !toId || !departureDate) {
            setError("Missing required search parameters.");
            return;
        }

        let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=INR`;
        if (returnDate) url += `&returnDate=${returnDate}`;
        if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

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
            console.log("Flight API Response:", result);

            if (result.status === true && result.data?.flightOffers?.length > 0) {
                // Filter flights based on budget
                const filteredFlights = result.data.flightOffers.filter((flight) => {
                    const price = flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                    return price <= budget;
                });

                setFlightOffers(filteredFlights);
            } else {
                setError("No flight deals found.");
                setFlightOffers([]);
            }
        } catch (error) {
            console.error("Error fetching flights:", error);
            setError("Failed to fetch flight data. Please try again later.");
        }
    };

    // Fetch hotels
    const fetchHotels = async () => {
        if (!toId || !departureDate || !returnDate) {
            setError("Missing required search parameters.");
            return;
        }

        const url = `https://${API_HOST}/api/v1/hotels/searchHotels?dest_id=${toId}&arrival_date=${departureDate}&departure_date=${returnDate}&adults=1&room_qty=1&currency_code=INR`;
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
            console.log("Hotel API Response:", result);

            if (result.status === true && result.data?.hotels?.length > 0) {
                // Filter hotels based on budget
                const filteredHotels = result.data.hotels.filter((hotel) => {
                    const price = hotel.property.priceBreakdown.grossPrice.value || Infinity;
                    return price <= budget;
                });

                setHotelOffers(filteredHotels);
            } else {
                setError("No hotel deals found.");
                setHotelOffers([]);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
            setError("Failed to fetch hotel data. Please try again later.");
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");

            await fetchFlights();
            await fetchHotels();

            setLoading(false);
        };

        fetchData();
    }, [fromId, toId, departureDate, returnDate, cabinClass, budget]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-6">Available Packages Within Budget</h1>
            {error && <div className="text-center text-red-500">{error}</div>}

            {/* Flight Offers Section */}
            {flightOffers.length > 0 && (
                <div className="w-full p-6">
                    <h2 className="text-2xl font-semibold mb-4">Flight Offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {flightOffers.map((deal, index) => {
                            const departureAirport = deal.segments?.[0]?.departureAirport;
                            const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
                            const departureTime = deal.segments?.[0]?.departureTime || "N/A";
                            const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
                            const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";

                            return (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                    {/* Flight Route */}
                                    <div className="border-b pb-3 mb-3">
                                        <div className="grid grid-cols-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-700">Departure</h3>
                                                <p className="text-gray-600">
                                                    {departureAirport?.name || "Unknown Airport"}, {departureAirport?.countryName || "Unknown Country"}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm text-blue-500 font-medium">One-way</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-700">Arrival</h3>
                                                <p className="text-gray-600">
                                                    {arrivalAirport?.name || "Unknown Airport"}, {arrivalAirport?.countryName || "Unknown Country"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flight Timing */}
                                    <div className="flex justify-between text-gray-600 mb-3">
                                        <div>
                                            <p className="font-medium">Departure Time</p>
                                            <p className="text-sm">{departureTime}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium">Arrival Time</p>
                                            <p className="text-sm">{arrivalTime}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="bg-gray-100 p-3 rounded-md mb-4">
                                        <p className="text-gray-700 font-semibold">Total Price:</p>
                                        <p className="text-xl font-bold text-blue-600">RS. {price}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hotel Offers Section */}
            {hotelOffers.length > 0 && (
                <div className="w-full p-6">
                    <h2 className="text-2xl font-semibold mb-4">Hotel Offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {hotelOffers.map((hotel, index) => {
                            const price = hotel.property.priceBreakdown.grossPrice.value || "N/A";
                            const name = hotel.property.name || "Unknown Hotel";
                            const rating = hotel.property.reviewScore || "N/A";
                            const reviewCount = hotel.property.reviewCount || "N/A";

                            return (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                    <h3 className="text-xl font-bold mb-2">{name}</h3>
                                    <div className="flex items-center mb-2">
                                        <span className="text-yellow-500">★</span>
                                        <span className="text-gray-700 ml-1">
                                            {rating} ({reviewCount} reviews)
                                        </span>
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded-md mb-4">
                                        <p className="text-gray-700 font-semibold">Total Price:</p>
                                        <p className="text-xl font-bold text-blue-600">RS. {price}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetails;