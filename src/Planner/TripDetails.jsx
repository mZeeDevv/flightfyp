import React, { useEffect, useState } from "react";
import Spinner from '../Components/Spinner';
import { FaStar } from "react-icons/fa";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import BookTrip from "../Components/BookTrip";
import { toast } from "react-toastify";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = "booking-com15.p.rapidapi.com";

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

// Add a function to fetch the correct dest_id for a city
const fetchDestinationId = async (city) => {
    const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(city)}`;
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
        console.log("Destination ID API Response:", result);

        if (result?.data?.length > 0) {
            return result.data[0].id; // Return the first matching dest_id
        } else {
            console.error("No destination ID found for city:", city);
            return null;
        }
    } catch (error) {
        console.error("Error fetching destination ID for city:", city, error);
        return null;
    }
};

const TripDetails = ({ searchResults, onFlightSelect, onHotelSelect}) => {
    const navigate = useNavigate();
    const uid = localStorage.getItem("userId");
    
    const [showFlightDetailsSidebar, setShowFlightDetailsSidebar] = useState(false);
    const [flightDetailsToken, setFlightDetailsToken] = useState(null);
    const [flightDetailsData, setFlightDetailsData] = useState(null);
    const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);
    const [flightDetailsError, setFlightDetailsError] = useState("");
    
    useEffect(() => {
    }, [searchResults]);

    if (!searchResults) {
        return null;
    }

    const { fromId, toId, departureDate, returnDate, cabinClass, budget, hotelBudget, daysOfStay } = searchResults;

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

    const [selectedFlightId, setSelectedFlightId] = useState(null);
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [totalSelectedPrice, setTotalSelectedPrice] = useState({
        flight: 0,
        hotel: 0
    });    const handleFlightClick = (token, price, flightData) => {
        setSelectedFlightId(token);
        setSelectedFlight(flightData);
        
        // Store original USD price
        const usdPrice = parseInt(price) || 0;
        
        setTotalSelectedPrice(prev => ({
            ...prev,
            flight: usdPrice
        }));
        
        // Pass both USD and PKR prices to parent component
        onFlightSelect(token, price, {
            usd: usdPrice,
            pkr: usdPrice * USD_TO_PKR_RATE
        });
    };
    
    const handleHotelClick = (hotelId, price, hotelData) => {
        setSelectedHotelId(hotelId);
        setSelectedHotel(hotelData);
        
        // Store original USD price
        const usdPrice = parseInt(price) || 0;
        
        setTotalSelectedPrice(prev => ({
            ...prev,
            hotel: usdPrice
        }));
        
        // Pass both USD and PKR prices to parent component
        onHotelSelect(hotelId, price, {
            usd: usdPrice,
            pkr: usdPrice * USD_TO_PKR_RATE,
            totalUsd: usdPrice * (daysOfStay || 1),
            totalPkr: usdPrice * USD_TO_PKR_RATE * (daysOfStay || 1)
        });
    };    const fetchFlights = async () => {
        if (!fromId || !toId || !departureDate) {
            toast.error("Missing required search parameters for flights.");
            return;
        }

        // Always use USD for API requests to ensure consistent currency handling
        let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=USD`;
        if (returnDate) url += `&returnDate=${returnDate}`;
        if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

        console.log("Fetching flights with URL:", url);
        console.log("User budget (USD):", budget);
        console.log("User budget (PKR):", budget * USD_TO_PKR_RATE);

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
                  // Filter flights based on USD budget
                const filteredFlights = result.data.flightOffers.filter((flight) => {
                    // Parse price as a number to ensure proper comparison
                    const priceUSD = parseFloat(flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units) || Infinity;
                    const pricePKR = priceUSD * USD_TO_PKR_RATE;
              
                    // Ensure budget is treated as a number
                    const budgetUSD = parseFloat(budget) || 0;
                    const budgetPKR = budgetUSD * USD_TO_PKR_RATE;
                    
                    console.log(`Flight: ${flight.transactionId}, Price: $${priceUSD} USD / Rs.${Math.floor(pricePKR)} PKR, Budget: $${budgetUSD} USD / Rs.${Math.floor(budgetPKR)} PKR`);
                    
                    // Strict numerical comparison
                    const isWithinBudget = priceUSD <= budgetUSD;
                    
                    console.log(`Is within budget: ${isWithinBudget}, Price type: ${typeof priceUSD}, Budget type: ${typeof budgetUSD}`);
                    
                    return isWithinBudget;
                });

                console.log(`After filtering: ${filteredFlights.length} flights remain`);
                
                if (filteredFlights.length === 0) {
                    toast.warn("No flights found within your budget. Please consider increasing your budget.");
                    setError("No flights available within your budget of Rs. " + Math.floor(budget * USD_TO_PKR_RATE) + " PKR");
                    setFlightOffers([]);
                    
                    // Sort flights by price to find the cheapest option
                    const sortedByPrice = [...result.data.flightOffers].sort((a, b) => {
                        const priceA = a.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        const priceB = b.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity;
                        return priceA - priceB;
                    });
                      if (sortedByPrice.length > 0) {
                        const cheapestPriceUSD = parseFloat(sortedByPrice[0].travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units);
                        const cheapestPricePKR = Math.floor(cheapestPriceUSD * USD_TO_PKR_RATE);
                        toast.info(`The cheapest available flight costs $${cheapestPriceUSD} USD (Rs. ${cheapestPricePKR} PKR)`);
                        console.log(`Cheapest flight price: $${cheapestPriceUSD} USD / Rs.${cheapestPricePKR} PKR, Your budget: $${parseFloat(budget)} USD / Rs.${Math.floor(parseFloat(budget) * USD_TO_PKR_RATE)} PKR`);
                    }
                } else {
                    setFlightOffers(filteredFlights);
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

    const fetchHotels = async () => {
        if (!toId || !departureDate) {
            setError("Missing required search parameters for hotels.");
            return;
        }

        let destId = toId;
        console.log("Original toId value:", toId);
        
        try {
            if (toId === "Islamabad International Airport" || toId === "ISB.AIRPORT") {
                destId = "1068102";
                console.log("Special case: Using specific destination ID for Islamabad:", destId);
            } else {
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
                    destId = toId;
                }
            }
        } catch (error) {
            console.error("Error finding destination ID:", error);
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
        }        console.log("Hotel search parameters:", {
            destId,
            arrivalDate,
            departureDateForHotels,
            daysOfStay,
            hotelBudget: hotelBudget, // USD budget
            hotelBudgetPKR: hotelBudget * USD_TO_PKR_RATE // PKR budget
        });

        // Always use USD for API requests to ensure consistent currency handling
        const url = `https://${API_HOST}/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=CITY&arrival_date=${arrivalDate}&departure_date=${departureDateForHotels}&adults=1&room_qty=1&currency_code=USD&units=metric&languagecode=en-us`;
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
                
                const filteredHotels = result.data.hotels.filter((hotel) => {
                    const pricePerNightUSD = parseFloat(hotel.property?.priceBreakdown?.grossPrice?.value) || Infinity;
                    const pricePerNightPKR = pricePerNightUSD * USD_TO_PKR_RATE;
                    const totalPriceUSD = pricePerNightUSD * (parseInt(daysOfStay) || 1);
                    const totalPricePKR = totalPriceUSD * USD_TO_PKR_RATE;
                    
                    // Ensure hotel budget is treated as a number
                    const hotelBudgetUSD = parseFloat(hotelBudget) || 0;
                    const hotelBudgetPKR = hotelBudgetUSD * USD_TO_PKR_RATE;
                    
                    console.log(`Hotel: ${hotel.property?.name}, Price per night: $${pricePerNightUSD} USD / Rs.${Math.floor(pricePerNightPKR)} PKR, 
                    Total for ${daysOfStay} nights: $${totalPriceUSD} USD / Rs.${Math.floor(totalPricePKR)} PKR, 
                    Hotel Budget: $${hotelBudgetUSD} USD / Rs.${Math.floor(hotelBudgetPKR)} PKR, 
                    Included: ${totalPriceUSD <= hotelBudgetUSD}`);
                    
                    return totalPriceUSD <= hotelBudgetUSD;
                });

                console.log(`After filtering: ${filteredHotels.length} hotels remain`);
                
                if (filteredHotels.length === 0) {
                    toast.warn("No hotels found within your budget. Please consider increasing your hotel budget.");
                    setError("No hotels available within your budget of Rs. " + Math.floor(hotelBudget * USD_TO_PKR_RATE) + " PKR for " + daysOfStay + " nights.");
                    setHotelOffers([]);
                    
                    const sortedByPrice = [...result.data.hotels].sort((a, b) => {
                        const priceA = a.property?.priceBreakdown?.grossPrice?.value || Infinity;
                        const priceB = b.property?.priceBreakdown?.grossPrice?.value || Infinity;
                        return priceA - priceB;
                    });
                    
                    if (sortedByPrice.length > 0) {
                        const cheapestPricePerNightUSD = sortedByPrice[0].property?.priceBreakdown?.grossPrice?.value;
                        const totalCheapestPriceUSD = cheapestPricePerNightUSD * (daysOfStay || 1);
                        const cheapestPricePerNightPKR = Math.floor(cheapestPricePerNightUSD * USD_TO_PKR_RATE);
                        const totalCheapestPricePKR = Math.floor(totalCheapestPriceUSD * USD_TO_PKR_RATE);
                        
                        toast.info(`The cheapest available hotel costs $${cheapestPricePerNightUSD} USD (Rs. ${cheapestPricePerNightPKR} PKR) per night 
                        (Total: $${totalCheapestPriceUSD} USD / Rs. ${totalCheapestPricePKR} PKR for ${daysOfStay} nights)`);
                    }
                } else {
                    setHotelOffers(filteredHotels);
                }
            } else {
                console.log("No hotel deals found in API response");
                setError("No hotel deals found.");
                toast.warn("No hotel deals found for your destination.");
                setHotelOffers([]);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
            setError("Failed to fetch hotel data. Please try again later.");
        }
    };

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
    }, [fromId, toId, departureDate, returnDate, cabinClass, budget, hotelBudget, daysOfStay]);

    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };    const calculateSavings = () => {
        // Get the PKR budget values from searchResults if available
        const budgetPKR = searchResults?.budgetPKR || (parseInt(budget) * USD_TO_PKR_RATE);
        const hotelBudgetPKR = searchResults?.hotelBudgetPKR || (parseInt(hotelBudget) * USD_TO_PKR_RATE);
        const totalBudgetPKR = budgetPKR + hotelBudgetPKR;
        
        // Calculate spending in PKR
        const totalHotelPricePKR = totalSelectedPrice.hotel * (daysOfStay || 1);
        const totalSpentPKR = totalSelectedPrice.flight + totalHotelPricePKR;
        
        // Calculate savings in PKR
        let savingsPKR = totalBudgetPKR - totalSpentPKR;
        savingsPKR = Math.max(0, savingsPKR);
        const savingsPercentage = totalBudgetPKR > 0 ? ((savingsPKR / totalBudgetPKR) * 100).toFixed(1) : "0.0";
        
        // Calculate USD values for internal use (but not for display)
        const totalBudget = parseInt(budget) + parseInt(hotelBudget);
        const totalHotelPrice = totalSelectedPrice.hotel / USD_TO_PKR_RATE * (daysOfStay || 1);
        const totalSpent = totalSelectedPrice.flight / USD_TO_PKR_RATE + totalHotelPrice;
        const savings = Math.max(0, totalBudget - totalSpent);
        
        return {
            amount: savings,
            amountPKR: savingsPKR,
            percentage: savingsPercentage,
            totalBudget: totalBudget,
            totalBudgetPKR: totalBudgetPKR,
            totalSpent: totalSpent,
            totalSpentPKR: totalSpentPKR
        };
    };

    const handleAddToFavorites = async () => {
        if (!selectedFlight || !selectedHotel) {
            toast.error("Please select both a flight and a hotel.");
            return;
        }
    
        try {
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
            
            const docRef = await addDoc(collection(db, "user_fav_trips"), favTripData);
            toast.success("Trip added to favorites!");
            navigate("/my-fav-trips");
        } catch (error) {
            console.log(error);
            toast.error("Failed to add trip to favorites. Please try again.");
        }
    };

    const handleViewFlightDetails = (event, token) => {
        event.stopPropagation();
        setFlightDetailsToken(token);
        setShowFlightDetailsSidebar(true);
        fetchFlightDetails(token);
    };
    
    const fetchFlightDetails = async (token) => {
        if (!token) return;
        
        setLoadingFlightDetails(true);
        setFlightDetailsError("");
        setFlightDetailsData(null);
        
        const url = `https://${API_HOST}/api/v1/flights/getFlightDetails?token=${token}&currency_code=INR`;
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
            console.log("Flight Details API Response:", result);
            
            if (result.status === true && result.data) {
                setFlightDetailsData(result.data);
            } else {
                setFlightDetailsError("No flight details found.");
            }
        } catch (error) {
            console.error("Error fetching flight details:", error);
            setFlightDetailsError("Failed to fetch flight details. Please try again later.");
        } finally {
            setLoadingFlightDetails(false);
        }
    };
    
    const closeFlightDetailsSidebar = () => {
        setShowFlightDetailsSidebar(false);
    };
    
    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-800">
                    <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
                        Discover Your Perfect Package
                    </h1>
                    <p className="text-center text-gray-400 max-w-2xl mx-auto">
                        We've curated the best flight and hotel combinations within your budget. Select your preferred options to continue.
                    </p>
                </div>
        
                {error && (
                    <div className="mb-6 p-4 bg-red-900 bg-opacity-60 border-l-4 border-red-500 text-red-100 rounded-lg">
                        <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            {error}
                        </p>
                    </div>
                )}
        
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-96">
                        <Spinner />
                        <p className="mt-4 text-blue-400 animate-pulse">Finding the best packages for you...</p>
                    </div>
                ) : (
                    <>
                        {flightOffers.length > 0 ? (
                            <div className="mb-12">
                                <div className="flex flex-wrap justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-white">
                                        <span className="border-b-2 border-blue-500 pb-1">Flight Options</span>
                                    </h2>
                                    <div className="flex space-x-2 mt-2 sm:mt-0">
                                        <div className="bg-blue-900 bg-opacity-50 px-4 py-1.5 rounded-full">
                                            <span className="text-sm font-semibold text-blue-200">Budget: </span>
                                            <span className="text-sm font-bold text-white">Rs. {searchResults?.budgetPKR || (budget * USD_TO_PKR_RATE)} PKR</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                                                className={`bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-xl shadow-lg hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer relative overflow-hidden
                                                    ${selectedFlightId === token ? 'ring-2 ring-blue-500 shadow-blue-500/30 transform scale-[1.02]' : ''}
                                                `}
                                                onClick={() => handleFlightClick(token, price, deal)}
                                            >
                                                {selectedFlightId === token && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <div className="bg-blue-500 text-white p-2 rounded-bl-lg shadow-lg">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="border-b border-gray-700 pb-3 mb-3">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-300">Departure</h3>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {departureAirport?.name || "Unknown Airport"}
                                                            </p>
                                                            <p className="text-xs text-blue-400 truncate">
                                                                {departureAirport?.countryName || "Unknown Country"}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="relative w-full flex items-center justify-center">
                                                                <div className="border-t border-dashed border-gray-600 w-full absolute"></div>
                                                                <div className="bg-blue-500 text-white p-1 rounded-full z-10 transform -translate-y-1/2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-blue-400 font-medium mt-2">One-way</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <h3 className="text-sm font-semibold text-gray-300">Arrival</h3>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {arrivalAirport?.name || "Unknown Airport"}
                                                            </p>
                                                            <p className="text-xs text-blue-400 truncate">
                                                                {arrivalAirport?.countryName || "Unknown Country"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-gray-400 mb-3">
                                                    <div>
                                                        <p className="text-xs font-medium">Departure</p>
                                                        <p className="text-xs">{departureTime}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-medium">Arrival</p>
                                                        <p className="text-xs">{arrivalTime}</p>
                                                    </div>
                                                </div>                                                <div className="bg-gray-700 p-2 rounded-lg mb-3 shadow-inner">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-gray-300 font-semibold">Price:</p>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-green-400">Rs. {price * USD_TO_PKR_RATE} PKR</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="w-full bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-all text-xs font-medium flex items-center justify-center"
                                                    onClick={(e) => handleViewFlightDetails(e, token)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View Details
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-12 bg-gray-900 bg-opacity-70 border border-gray-800 rounded-lg p-6">
                                <div className="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Flight Options Available</h3>
                                    <p className="text-gray-400 text-center">No flight offers found within your budget of Rs. {searchResults?.budgetPKR || (budget * USD_TO_PKR_RATE)} PKR</p>
                                    <p className="text-gray-500 text-sm mt-2">Try increasing your flight budget for more options</p>
                                </div>
                            </div>
                        )}
            
                        {hotelOffers.length > 0 ? (
                            <div className="mb-12">
                                <div className="flex flex-wrap justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-white">
                                        <span className="border-b-2 border-purple-500 pb-1">Hotel Options</span>
                                    </h2>
                                    <div className="flex space-x-2 mt-2 sm:mt-0">
                                        <div className="bg-purple-900 bg-opacity-50 px-4 py-1.5 rounded-full flex items-center">
                                            <span className="text-sm font-semibold text-purple-200">Budget: </span>
                                            <span className="text-sm font-bold text-white ml-1">Rs. {searchResults?.hotelBudgetPKR || (hotelBudget * USD_TO_PKR_RATE)} PKR</span>
                                        </div>
                                        <div className="bg-purple-900 bg-opacity-50 px-4 py-1.5 rounded-full">
                                            <span className="text-sm font-semibold text-purple-200">Stay: </span>
                                            <span className="text-sm font-bold text-white">{daysOfStay || 1} {daysOfStay === 1 ? 'night' : 'nights'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {hotelOffers.map((hotel) => (
                                        <div
                                            key={hotel.hotel_id}
                                            className={`bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden relative cursor-pointer hover:shadow-purple-900/20 transition-all duration-300
                                                ${selectedHotelId === hotel.hotel_id ? 'ring-2 ring-purple-500 shadow-purple-500/30 transform scale-[1.02]' : ''}
                                            `}
                                            onClick={() => handleHotelClick(hotel.hotel_id, hotel.property.priceBreakdown.grossPrice.value, hotel)}
                                        >
                                            {selectedHotelId === hotel.hotel_id && (
                                                <div className="absolute -top-1 -right-1 z-10">
                                                    <div className="bg-purple-500 text-white p-2 rounded-bl-lg shadow-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <img
                                                    src={hotel.property.photoUrls[0]}
                                                    alt={hotel.property.name}
                                                    className="w-full h-36 object-cover"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-12"></div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-bold mb-1 text-white truncate">{hotel.property.name}</h3>
                                                <div className="flex items-center mb-2">
                                                    <div className="flex items-center bg-yellow-900 bg-opacity-40 px-2 py-0.5 rounded-full">
                                                        <FaStar className="text-yellow-400 mr-1" size={12} />
                                                        <span className="text-xs text-yellow-100 font-medium">
                                                            {hotel.property.reviewScore} 
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        ({hotel.property.reviewCount} reviews)
                                                    </span>
                                                </div>                                                <div className="text-xs text-gray-300 mb-2">                                                    <div className="flex justify-between items-center">
                                                        <span>Price per night:</span>
                                                        <span className="font-semibold text-white">
                                                            Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value * USD_TO_PKR_RATE)} PKR
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-gray-700 p-2 mt-2 rounded-lg shadow-inner">
                                                        <span>Total ({daysOfStay || 1} nights):</span>
                                                        <div className="text-right">
                                                            <div className="font-bold text-green-400">
                                                                Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value * USD_TO_PKR_RATE) * (daysOfStay || 1)} PKR
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <a
                                                        href={getGoogleMapsLink(hotel.property.latitude, hotel.property.longitude)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-400 hover:underline flex items-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        Map
                                                    </a>
                                                    <button className="bg-purple-600 text-white py-1 px-3 rounded-lg hover:bg-purple-700 transition-all text-xs font-medium">
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-12 bg-gray-900 bg-opacity-70 border border-gray-800 rounded-lg p-6">
                                <div className="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Hotel Options Available</h3>
                                    <p className="text-gray-400 text-center">No hotel offers found within your budget of Rs. {searchResults?.hotelBudgetPKR || (hotelBudget * USD_TO_PKR_RATE)} PKR for {daysOfStay || 1} night(s)</p>
                                    <p className="text-gray-500 text-sm mt-2">Try increasing your hotel budget for more options</p>
                                </div>
                            </div>
                        )}
            
                        {!flightOffers.length && !hotelOffers.length && !loading && !error && (
                            <div className="flex flex-col items-center justify-center p-10 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-2xl font-bold text-gray-300 mb-2">No Matching Packages Found</h3>
                                <p className="text-gray-400 text-center max-w-lg">
                                    We couldn't find any flight and hotel combinations that match your criteria. 
                                    Please try adjusting your budget or dates for better results.
                                </p>
                                <button 
                                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                                    onClick={() => navigate(-1)}
                                >
                                    Return to Trip Planner
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        
            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black bg-opacity-95 shadow-lg py-3 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 md:mb-0">
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Flight Budget:</p>
                                    <p className="text-xs font-bold text-white text-right">Rs. {searchResults?.budgetPKR || (budget * USD_TO_PKR_RATE)}</p>
                                
                                    <p className="text-xs text-gray-400">Selected Price:</p>
                                    <p className="text-xs font-bold text-green-400 text-right">
                                        Rs. {totalSelectedPrice.flight * USD_TO_PKR_RATE || "0"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Hotel Budget:</p>
                                    <p className="text-xs font-bold text-white text-right">Rs. {searchResults?.hotelBudgetPKR || (hotelBudget * USD_TO_PKR_RATE)}</p>
                                    
                                    <p className="text-xs text-gray-400">Selected Hotel:</p>
                                    <p className="text-xs font-bold text-green-400 text-right">
                                        Rs. {totalSelectedPrice.hotel * 280 * (daysOfStay || 1) || "0" }
                                        <span className="text-gray-500 text-xs"> ({daysOfStay || 1} nights)</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-800 p-2 rounded-lg">                                <div className="grid grid-cols-2 gap-x-4">                                    <p className="text-xs text-gray-400">Total Budget:</p>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white">Rs. {calculateSavings().totalBudgetPKR} PKR</p>
                                    </div>
                                    
                                    <p className="text-xs text-gray-400">Total Savings:</p>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-green-400">
                                            Rs. {calculateSavings().amountPKR} PKR ({calculateSavings().percentage}%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleAddToFavorites}
                                disabled={!selectedFlightId || !selectedHotelId}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium flex items-center
                                    ${(!selectedFlightId || !selectedHotelId)
                                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
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
                                    buttonLabel={
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            Book This Package
                                        </span>
                                    }
                                    buttonClassName="px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                                    onSuccess={() => navigate('/dashboard')}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        
            {showFlightDetailsSidebar && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={closeFlightDetailsSidebar}
                    ></div>
                    
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="relative w-screen max-w-md">
                            <div className="h-full bg-gray-800 shadow-xl flex flex-col overflow-y-auto">
                                <div className="px-4 py-6 bg-gray-900 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">Flight Details</h2>
                                    <button 
                                        onClick={closeFlightDetailsSidebar}
                                        className="text-gray-400 hover:text-white focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="flex-1 px-4 py-6">
                                    {loadingFlightDetails ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Spinner />
                                        </div>
                                    ) : flightDetailsError ? (
                                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                                            <p>{flightDetailsError}</p>
                                        </div>
                                    ) : flightDetailsData ? (
                                        <div className="space-y-6 text-gray-200">
                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Flight Route</h3>
                                                <p className="text-gray-300">
                                                    {flightDetailsData.segments?.[0]?.departureAirport?.name} → {flightDetailsData.segments?.[0]?.arrivalAirport?.name}
                                                </p>
                                            </div>

                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Timing</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="font-medium">Departure</p>
                                                        <p className="text-gray-300">
                                                            {flightDetailsData.segments?.[0]?.departureTime || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Arrival</p>
                                                        <p className="text-gray-300">
                                                            {flightDetailsData.segments?.[0]?.arrivalTime || "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Price</h3>
                                                <p className="text-green-400 font-bold">
                                                    RS. {flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A"}
                                                </p>
                                            </div>

                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Luggage Information</h3>
                                                {flightDetailsData.segments?.map((segment, segmentIndex) => (
                                                    <div key={segmentIndex} className="mb-4">
                                                        <p className="font-medium">Segment {segmentIndex + 1}</p>
                                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                                            <div className="bg-gray-700 p-2 rounded">
                                                                <p className="font-medium text-sm">Cabin Luggage</p>
                                                                <p className="text-gray-300 text-sm">
                                                                    {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.maxPiece} piece(s),{" "}
                                                                    {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.maxWeightPerPiece}{" "}
                                                                    {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.massUnit}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-700 p-2 rounded">
                                                                <p className="font-medium text-sm">Checked Luggage</p>
                                                                <p className="text-gray-300 text-sm">
                                                                    {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxPiece} piece(s),{" "}
                                                                    {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxTotalWeight}{" "}
                                                                    {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.massUnit}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Flight Stops</h3>
                                                {flightDetailsData.segments?.[0]?.legs?.map((leg, index) => {
                                                    const uniqueCarriers = leg.carriersData?.filter(
                                                        (carrier, carrierIndex, self) =>
                                                            self.findIndex((c) => c.name === carrier.name) === carrierIndex
                                                    );

                                                    return (
                                                        <div key={index} className={`mb-4 ${index !== flightDetailsData.segments[0].legs.length - 1 ? 'border-b border-gray-600 pb-4' : ''}`}>
                                                            <p className="font-medium">Leg {index + 1}</p>
                                                            <p className="text-gray-300">
                                                                {leg.departureAirport?.name} → {leg.arrivalAirport?.name}
                                                            </p>
                                                            <p className="text-gray-300">Departure: {leg.departureTime}</p>
                                                            <p className="text-gray-300">Arrival: {leg.arrivalTime}</p>
                                                            
                                                            <div className="mt-2">
                                                                <h4 className="text-md font-semibold">Airline:</h4>
                                                                <div className="flex flex-wrap gap-4 mt-2">
                                                                    {uniqueCarriers?.map((carrier, carrierIndex) => (
                                                                        <div key={carrierIndex} className="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                                                                            <img
                                                                                src={carrier.logo}
                                                                                alt={`${carrier.name} logo`}
                                                                                className="w-8 h-8 rounded-full"
                                                                            />
                                                                            <p className="text-gray-300 text-sm">{carrier.name}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="border-b border-gray-700 pb-4">
                                                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-gray-700 p-2 rounded">
                                                        <p className="font-medium text-sm">Cabin Class</p>
                                                        <p className="text-gray-300 text-sm">{flightDetailsData.segments?.[0]?.cabinClass || "N/A"}</p>
                                                    </div>
                                                    <div className="bg-gray-700 p-2 rounded">
                                                        <p className="font-medium text-sm">Trip Type</p>
                                                        <p className="text-gray-300 text-sm">{flightDetailsData.tripType || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    onClick={() => {
                                                        const price = flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || 0;
                                                        handleFlightClick(flightDetailsToken, price, flightDetailsData);
                                                        closeFlightDetailsSidebar();
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                                                >
                                                    Select This Flight
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            No flight details available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetails;