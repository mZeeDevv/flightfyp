import React, { use, useEffect, useState } from "react";
import Spinner from '../Components/Spinner';
import { FaStar } from "react-icons/fa";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import BookTrip from "../Components/BookTrip";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";

const TripDetails = ({ searchResults, onFlightSelect, onHotelSelect}) => {
    const navigate = useNavigate();
    // Debug props
    const uid = localStorage.getItem("userId");
    useEffect(() => {
    }, [searchResults]);

    // Don't render if no search results
    if (!searchResults) {
        return null;
    }

    const { fromId, toId, departureDate, returnDate, cabinClass, budget, daysOfStay } = searchResults;

    // Validate required props
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

    // State for selected items
    const [selectedFlightId, setSelectedFlightId] = useState(null);
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [totalSelectedPrice, setTotalSelectedPrice] = useState({
        flight: 0,
        hotel: 0
    });

    // Click handlers
    const handleFlightClick = (token, price, flightData) => {
        setSelectedFlightId(token);
        setSelectedFlight(flightData);
        setTotalSelectedPrice(prev => ({
            ...prev,
            flight: parseInt(price) || 0
        }));
        onFlightSelect(token, price);
    };
    
    const handleHotelClick = (hotelId, price, hotelData) => {
        setSelectedHotelId(hotelId);
        setSelectedHotel(hotelData);
        setTotalSelectedPrice(prev => ({
            ...prev,
            hotel: parseInt(price) || 0
        }));
        onHotelSelect(hotelId, price);
    };

    // Fetch flights
    const fetchFlights = async () => {
        if (!fromId || !toId || !departureDate) {
            toast.error("Missing required search parameters for flights.");
            return;
        }

        let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=INR`;
        if (returnDate) url += `&returnDate=${returnDate}`;
        if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

        console.log("Fetching flights with URL:", url);

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
                
                // Filter flights based on budget, but be more lenient
                const filteredFlights = result.data.flightOffers.filter((flight) => {
                    const price = flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                    console.log(`Flight price: ${price}, Budget: ${budget}, Included: ${price <= budget * 1.5}`);
                    // Be more lenient with the budget - allowing up to 50% more
                    return price <= budget * 1.5;
                });

                console.log(`After filtering: ${filteredFlights.length} flights remain`);
                setFlightOffers(filteredFlights);
                
                if (filteredFlights.length === 0) {
                    // If no flights after strict filtering, add some flights anyway
                    const sortedByPrice = [...result.data.flightOffers].sort((a, b) => {
                        const priceA = a.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        const priceB = b.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        return priceA - priceB;
                    });
                    
                    // Take the 5 cheapest flights
                    const cheapestFlights = sortedByPrice.slice(0, 5);
                    console.log("Showing 5 cheapest flights instead");
                    setFlightOffers(cheapestFlights);
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
    };

    // Fetch hotels
    const fetchHotels = async () => {
        if (!toId || !departureDate) {
            setError("Missing required search parameters for hotels.");
            return;
        }

        let destId = toId;
        try {
            const searchDestinationUrl = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${toId}`;
            console.log("Searching for destination ID with URL:", searchDestinationUrl);
            
            const searchDestinationOptions = {
                method: "GET",
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": API_HOST,
                },
            };

            const searchResponse = await fetch(searchDestinationUrl, searchDestinationOptions);
            const searchResult = await searchResponse.json();
            console.log("Destination search result:", searchResult);

            if (searchResult.status === true && searchResult.data?.length > 0) {
                destId = searchResult.data[0].dest_id;
                console.log(`Found destination ID: ${destId}`);
            } else {
                console.log("No destination found. Using original toId as destId");
                // Try using the original toId as a fallback
                destId = toId;
            }
        } catch (error) {
            console.error("Error finding destination ID:", error);
            // Continue with the original toId
            console.log("Using original toId as destId due to error");
        }
        
        const arrivalDate = departureDate;
        let departureDateForHotels = returnDate;
        if (!departureDateForHotels && daysOfStay) {
            const arrival = new Date(arrivalDate);
            const maxDepartureDate = new Date(arrival);
            maxDepartureDate.setDate(arrival.getDate() + 90);
            const calculatedDate = new Date(arrival);
            calculatedDate.setDate(arrival.getDate() + parseInt(daysOfStay));
            if (calculatedDate > maxDepartureDate) {
                setError("Departure date must be within 90 days after arrival date.");
                return;
            }
            departureDateForHotels = calculatedDate.toISOString().split("T")[0];
        }
        if (!departureDateForHotels) {
            setError("Missing departure date or days of stay for hotels.");
            return;
        }

        console.log("Hotel search parameters:", {
            destId,
            arrivalDate,
            departureDateForHotels,
            daysOfStay
        });

        // Step 3: Fetch hotels using the retrieved dest_id
        const url = `https://${API_HOST}/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=CITY&arrival_date=${arrivalDate}&departure_date=${departureDateForHotels}&adults=1&room_qty=1&currency_code=INR`;
        console.log("Fetching hotels with URL:", url);
        
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
            console.log("Hotel API response:", result);
            
            if (result.status === true && result.data?.hotels?.length > 0) {
                console.log(`Found ${result.data.hotels.length} total hotels before filtering`);
                
                // Filter hotels based on budget, but be more lenient
                const filteredHotels = result.data.hotels.filter((hotel) => {
                    const pricePerNight = hotel.property?.priceBreakdown?.grossPrice?.value || Infinity;
                    const totalPrice = pricePerNight * (daysOfStay || 1);
                    console.log(`Hotel: ${hotel.property?.name}, Price per night: ${pricePerNight}, Total for ${daysOfStay} nights: ${totalPrice}, Budget: ${budget}, Included: ${totalPrice <= budget * 1.5}`);
                    
                    // Be more lenient with the budget - allowing up to 50% more
                    return totalPrice <= budget * 1.5;
                });

                console.log(`After filtering: ${filteredHotels.length} hotels remain`);
                setHotelOffers(filteredHotels);
                
                if (filteredHotels.length === 0) {
                    // If no hotels after strict filtering, add some hotels anyway
                    const sortedByPrice = [...result.data.hotels].sort((a, b) => {
                        const priceA = a.property?.priceBreakdown?.grossPrice?.value || Infinity;
                        const priceB = b.property?.priceBreakdown?.grossPrice?.value || Infinity;
                        return priceA - priceB;
                    });
                    
                    // Take the 5 cheapest hotels
                    const cheapestHotels = sortedByPrice.slice(0, 5);
                    console.log("Showing 5 cheapest hotels instead");
                    setHotelOffers(cheapestHotels);
                }
            } else {
                console.log("No hotel deals found in API response");
                setError("No hotel deals found.");
                toast.warn("No hotel deals found within your budget.");
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
        setSelectedFlightId(null);
        setSelectedHotelId(null);
        setSelectedFlight(null); 
        setSelectedHotel(null); 
        setTotalSelectedPrice({ flight: 0, hotel: 0 });
    }, [fromId, toId, departureDate, returnDate, cabinClass, budget, daysOfStay]);

    // Function to generate Google Maps link
    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    // Calculate savings
    const calculateSavings = () => {
        const totalHotelPrice = totalSelectedPrice.hotel * (daysOfStay || 1);
        const totalSpent = totalSelectedPrice.flight + totalHotelPrice;
        let savings = budget - totalSpent;
        savings = Math.max(0, savings);
        const savingsPercentage = ((savings / budget) * 100).toFixed(1);
        return {
            amount: savings,
            percentage: savingsPercentage
        };
    };

    // Handle adding to favorites
    const handleAddToFavorites = async () => {
        if (!selectedFlight || !selectedHotel) {
            toast.error("Please select both a flight and a hotel.");
            return;
        }
    
        try {
            // Calculate the total hotel price based on days of stay
            const hotelPricePerDay = totalSelectedPrice.hotel || 0;
            const totalHotelPrice = hotelPricePerDay * (daysOfStay || 1);
            
            const favTripData = {
                userId: uid,
                createdAt: new Date().toISOString(),
                flight: {
                    token: selectedFlight.token || '',
                    transactionId: selectedFlight.transactionId || '',
                    flightNumber: selectedFlight.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
                    amount: totalSelectedPrice.flight || 0,
                    departure: selectedFlight.segments?.[0]?.departureAirport?.name || 'N/A',
                    arrival: selectedFlight.segments?.[0]?.arrivalAirport?.name || 'N/A',
                    departureTime: selectedFlight.segments?.[0]?.departureTime || 'N/A',
                    arrivalTime: selectedFlight.segments?.[0]?.arrivalTime || 'N/A',
                },
                hotel: {
                    id: selectedHotel.hotel_id || '',
                    name: selectedHotel.property?.name || 'N/A',
                    location: selectedHotel.property?.address || 'N/A',
                    pricePerDay: hotelPricePerDay,
                    totalPrice: totalHotelPrice,
                    daysOfStay: daysOfStay || 1,
                    rating: selectedHotel.property?.reviewScore || 'N/A',
                },
            };
    
            console.log("Saving trip to favorites:", favTripData);
            
            // Save the trip data to Firebase
            const docRef = await addDoc(collection(db, "user_fav_trips"), favTripData);
            toast.success("Trip added to favorites!");
            navigate("/my-fav-trips");
        } catch (error) {
            console.log(error);
            toast.error("Failed to add trip to favorites. Please try again.");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-black bg-opacity-90 min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-center text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Available Packages Within Budget
            </h1>
        
            {error && (
                <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
        
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner />
                </div>
            ) : (
                <>
                    {/* Flight Offers Section */}
                    {flightOffers.length > 0 ? (
                        <div className="mb-12">
                            <h2 className="text-3xl font-semibold mb-6 text-white">Flight Offers</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                                            className={`bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer relative
                                                ${selectedFlightId === token ? 'ring-2 ring-blue-500 transform scale-[1.02]' : ''}
                                            `}
                                            onClick={() => handleFlightClick(token, price, deal)}
                                        >
                                            {selectedFlightId === token && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="bg-blue-500 text-white p-1 rounded-full">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="border-b border-gray-700 pb-2 mb-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-300">Departure</h3>
                                                        <p className="text-xs text-gray-400">
                                                            {departureAirport?.name || "Unknown Airport"}, {departureAirport?.countryName || "Unknown Country"}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs text-blue-400 font-medium">One-way</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-300">Arrival</h3>
                                                        <p className="text-xs text-gray-400">
                                                            {arrivalAirport?.name || "Unknown Airport"}, {arrivalAirport?.countryName || "Unknown Country"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-gray-400 mb-2">
                                                <div>
                                                    <p className="text-xs font-medium">Departure Time</p>
                                                    <p className="text-xs">{departureTime}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium">Arrival Time</p>
                                                    <p className="text-xs">{arrivalTime}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-700 p-2 rounded-lg mb-2">
                                                <p className="text-xs text-gray-300 font-semibold">Total Price:</p>
                                                <p className="text-sm font-bold text-blue-400">RS. {price}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 mb-8">
                            No flight offers available within your budget
                        </div>
                    )}
        
                    {/* Hotel Offers Section */}
                    {hotelOffers.length > 0 ? (
                        <div className="mb-12">
                            <h2 className="text-3xl font-semibold mb-6 text-white">
                                Hotel Offers ({daysOfStay || 1} {daysOfStay === 1 ? 'night' : 'nights'} stay)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {hotelOffers.map((hotel) => (
                                    <div
                                        key={hotel.hotel_id}
                                        className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden relative cursor-pointer
                                            ${selectedHotelId === hotel.hotel_id ? 'ring-2 ring-blue-500 transform scale-[1.02]' : ''}
                                        `}
                                        onClick={() => handleHotelClick(hotel.hotel_id, hotel.property.priceBreakdown.grossPrice.value, hotel)}
                                    >
                                        {selectedHotelId === hotel.hotel_id && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <div className="bg-blue-500 text-white p-1 rounded-full">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                        <img
                                            src={hotel.property.photoUrls[0]}
                                            alt={hotel.property.name}
                                            className="w-full h-36 object-cover"
                                        />
                                        <div className="p-2">
                                            <h3 className="text-sm font-bold mb-1 text-white">{hotel.property.name}</h3>
                                            <div className="flex items-center mb-1">
                                                <FaStar className="text-yellow-400 mr-1" />
                                                <span className="text-xs text-gray-300">
                                                    {hotel.property.reviewScore} ({hotel.property.reviewCount} reviews)
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-300 mb-1">
                                                <div className="flex justify-between items-center">
                                                    <span>Price per night:</span>
                                                    <span className="font-semibold">RS. {Math.floor(hotel.property.priceBreakdown.grossPrice.value)}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-gray-700 p-1 mt-1 rounded-md">
                                                    <span>Total for {daysOfStay || 1} nights:</span>
                                                    <span className="font-bold text-blue-400">
                                                        RS. {Math.floor(hotel.property.priceBreakdown.grossPrice.value) * (daysOfStay || 1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <a
                                                href={getGoogleMapsLink(hotel.property.latitude, hotel.property.longitude)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:underline"
                                            >
                                                View on Google Maps
                                            </a>
                                            <button className="w-full bg-blue-600 text-white py-1 rounded-lg hover:bg-blue-700 transition-all mt-2 text-xs">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 mb-8">
                            No hotel offers available within your budget
                        </div>
                    )}
        
                    {/* No Results Message */}
                    {!flightOffers.length && !hotelOffers.length && !loading && !error && (
                        <div className="text-center text-gray-400">
                            No packages found matching your criteria. Try adjusting your budget or dates.
                        </div>
                    )}
                </>
            )}
        
            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 bg-opacity-95 shadow-lg p-4 border-t border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        <p className="text-xs text-gray-300">Total Budget: <span className="font-bold text-white">RS. {budget}</span></p>
                        <p className="text-xs text-gray-300">Selected Flight: <span className="font-bold text-blue-400">RS. {totalSelectedPrice.flight}</span></p>
                        <p className="text-xs text-gray-300">
                            Selected Hotel: 
                            <span className="font-bold text-blue-400">
                                RS. {totalSelectedPrice.hotel} × {daysOfStay || 1} {daysOfStay === 1 ? 'night' : 'nights'} = 
                                <span className="text-green-400"> RS. {totalSelectedPrice.hotel * (daysOfStay || 1)}</span>
                            </span>
                        </p>
                        <p className="text-xs text-green-400">
                            Savings: <span className="font-bold">RS. {calculateSavings().amount}</span>
                            <span className="text-xs ml-1">({calculateSavings().percentage}%)</span>
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleAddToFavorites}
                            disabled={!selectedFlightId || !selectedHotelId}
                            className={`px-4 py-1 rounded-lg transition-all duration-300 text-xs
                                ${(!selectedFlightId || !selectedHotelId)
                                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            Add to Favorites
                        </button>
                        
                        {selectedFlight && selectedHotel && (
                            <BookTrip 
                                tripData={{
                                    flight: {
                                        token: selectedFlight.token || '',
                                        transactionId: selectedFlight.transactionId || '',
                                        flightNumber: selectedFlight.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
                                        amount: totalSelectedPrice.flight || 0,
                                        departure: selectedFlight.segments?.[0]?.departureAirport?.name || 'N/A',
                                        arrival: selectedFlight.segments?.[0]?.arrivalAirport?.name || 'N/A',
                                        departureTime: selectedFlight.segments?.[0]?.departureTime || 'N/A',
                                        arrivalTime: selectedFlight.segments?.[0]?.arrivalTime || 'N/A',
                                    },
                                    hotel: {
                                        id: selectedHotel.hotel_id || '',
                                        name: selectedHotel.property?.name || 'N/A',
                                        location: selectedHotel.property?.address || 'N/A',
                                        pricePerDay: totalSelectedPrice.hotel || 0,
                                        totalPrice: (totalSelectedPrice.hotel || 0) * (daysOfStay || 1),
                                        daysOfStay: daysOfStay || 1,
                                        rating: selectedHotel.property?.reviewScore || 'N/A',
                                    }
                                }}
                                buttonLabel="Proceed to Book"
                                buttonClassName={`px-4 py-1 rounded-lg transition-all duration-300 text-xs
                                    ${(!selectedFlightId || !selectedHotelId)
                                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                onSuccess={() => navigate('/dashboard')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripDetails;