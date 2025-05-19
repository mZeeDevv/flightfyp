import React, { useState, useEffect } from 'react';
import { useParams, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaWifi, FaParking, FaSwimmingPool, FaCoffee, FaUtensils, FaCheck, FaCreditCard, FaArrowLeft, FaSpinner, FaInfoCircle } from 'react-icons/fa';

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

const HotelDetails = () => {
    const { hotelId } = useParams();
    const locationRouter = useRouterLocation();
    const navigate = useNavigate();
    
    // Get data passed from the Hotels page
    const { 
        arrivalDate,
        departureDate,
        adults = 1,
        childrenAge = [],
        roomQty = 1
    } = locationRouter.state || {};
    
    const [hotelDetails, setHotelDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    // Room detail sidebar state
    const [showRoomDetailsSidebar, setShowRoomDetailsSidebar] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    
    // Format childrenAge array for API request
    const childrenAgeParam = childrenAge && childrenAge.length > 0 ? childrenAge.join(',') : '';
    
    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";
    
    useEffect(() => {
        const fetchHotelDetails = async () => {
            if (!hotelId) {
                setError("Hotel ID is required");
                setLoading(false);
                return;
            }
            
            if (!arrivalDate || !departureDate) {
                setError("Arrival and departure dates are required");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                
                // Construct the API URL with required parameters
                let url = new URL(`https://${API_HOST}/api/v1/hotels/getHotelDetails`);
                url.searchParams.append('hotel_id', hotelId);
                url.searchParams.append('arrival_date', arrivalDate);
                url.searchParams.append('departure_date', departureDate);
                url.searchParams.append('adults', adults);
                url.searchParams.append('room_qty', roomQty);
                url.searchParams.append('languagecode', 'en-us');
                url.searchParams.append('currency_code', 'USD');
                
                // Add children_age parameter if it exists
                if (childrenAgeParam) {
                    url.searchParams.append('children_age', childrenAgeParam);
                }
                
                // Add optional parameters
                url.searchParams.append('units', 'metric');
                url.searchParams.append('temperature_unit', 'c');
                
                const options = {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-key': RAPIDAPI_KEY,
                        'x-rapidapi-host': API_HOST,
                    },
                };
                
                console.log("Fetching hotel details with URL:", url.toString());
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const result = await response.json();
                console.log("Hotel details API response:", result);
                
                if (result.status === true && result.data) {
                    setHotelDetails(result.data);
                } else {
                    setError(result.message || "Failed to fetch hotel details");
                }
            } catch (error) {
                console.error("Error fetching hotel details:", error);
                setError("Failed to load hotel details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchHotelDetails();
    }, [hotelId, arrivalDate, departureDate, adults, childrenAgeParam, roomQty]);
    
    // Function to get amenity icon
    const getAmenityIcon = (amenity) => {
        const amenityLower = amenity.toLowerCase();
        if (amenityLower.includes('wifi')) return <FaWifi />;
        if (amenityLower.includes('parking')) return <FaParking />;
        if (amenityLower.includes('pool') || amenityLower.includes('swimming')) return <FaSwimmingPool />;
        if (amenityLower.includes('breakfast') || amenityLower.includes('coffee')) return <FaCoffee />;
        if (amenityLower.includes('restaurant') || amenityLower.includes('dining')) return <FaUtensils />;
        return <FaCheck />;
    };
    
    // Function to navigate back to the previous page
    const handleGoBack = () => {
        navigate(-1);
    };
    
    // Function to navigate to booking page
    const handleBookNow = () => {
        // Navigate to booking page or show booking modal
        // You could implement this based on your application's flow
        navigate("/hotels");
    };
    
    // Function to view room details
    const handleViewRoomDetails = (room) => {
        setSelectedRoom(room);
        setShowRoomDetailsSidebar(true);
    };
    
    // Function to close room details sidebar
    const closeRoomDetailsSidebar = () => {
        setShowRoomDetailsSidebar(false);
    };
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
                <p className="text-gray-600">Loading hotel details...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded max-w-2xl w-full">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleGoBack}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Hotels
                </button>
            </div>
        );
    }
    
    if (!hotelDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <p className="text-gray-600 mb-4">No hotel details available</p>
                <button 
                    onClick={handleGoBack}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Hotels
                </button>
            </div>
        );
    }
    
    // Extract key details from the API response
    const {
        basicPropertyData = {},
        hotelPhotos = [],
        hotelFacilities = [],
        hotelDescription = {},
        roomTypes = [],
        policies = {},
        location = {},
        reviewScore = {}
    } = hotelDetails;
    
    // Calculate nights of stay for pricing
    const calculateNightsOfStay = () => {
        if (!arrivalDate || !departureDate) return 1;
        const arrival = new Date(arrivalDate);
        const departure = new Date(departureDate);
        const diffTime = departure.getTime() - arrival.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
    };
    
    const nightsOfStay = calculateNightsOfStay();
    
    return (
        <div className="bg-gray-100 min-h-screen pb-12">
            {/* Back button */}
            <div className="bg-white shadow-md p-4">
                <div className="container mx-auto">
                    <button 
                        onClick={handleGoBack}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back to Hotels
                    </button>
                </div>
            </div>
            
            {/* Main content */}
            <div className="container mx-auto px-4 py-8">
                {/* Hotel name and rating */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{basicPropertyData.name}</h1>
                            <div className="flex items-center mt-2">
                                <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                    <FaStar className="mr-1" />
                                    <span className="font-bold">{reviewScore.score || "N/A"}</span>
                                    <span className="mx-1">•</span>
                                    <span>{reviewScore.reviewCount || 0} reviews</span>
                                </div>
                                <span className="ml-3 text-gray-500">{basicPropertyData.starRating || 0} stars</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            {roomTypes[0]?.roomPrices?.dailyPrices && (
                                <div className="text-right">
                                    <p className="text-gray-600">From</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${roomTypes[0].roomPrices.dailyPrices[0].price} USD
                                    </p>
                                    <p className="text-lg text-blue-800">
                                        Rs. {Math.floor(roomTypes[0].roomPrices.dailyPrices[0].price * USD_TO_PKR_RATE)} PKR
                                    </p>
                                    <p className="text-sm text-gray-500">per night</p>
                                    
                                    <div className="mt-1 p-1 bg-green-100 text-green-800 rounded text-sm">
                                        Total: ${roomTypes[0].roomPrices.totalPrice} USD / 
                                        Rs. {Math.floor(roomTypes[0].roomPrices.totalPrice * USD_TO_PKR_RATE)} PKR
                                        <span className="text-xs ml-1">({nightsOfStay} nights)</span>
                                    </div>
                                    
                                    <button 
                                        onClick={handleBookNow}
                                        className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <FaCreditCard className="mr-2" />
                                        Book Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Address */}
                    <div className="flex items-start text-gray-600 mb-4">
                        <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0" />
                        <address className="not-italic">
                            {location.address}, {location.city}, {location.country}
                        </address>
                    </div>
                </div>
                
                {/* Photo gallery */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Photos</h2>
                    <div className="flex flex-col">
                        {/* Main image */}
                        <div className="w-full h-96 overflow-hidden rounded-lg mb-2">
                            <img 
                                src={hotelPhotos[activeImageIndex]?.url_max} 
                                alt={basicPropertyData.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        {/* Thumbnails */}
                        <div className="flex overflow-x-auto space-x-2 pb-2">
                            {hotelPhotos.map((photo, index) => (
                                <img 
                                    key={index}
                                    src={photo.url_square60}
                                    alt={`Room ${index + 1}`}
                                    className={`w-20 h-20 object-cover rounded cursor-pointer ${activeImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                                    onClick={() => setActiveImageIndex(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Hotel description */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
                    <div className="prose max-w-none">
                        <p>{hotelDescription.description}</p>
                    </div>
                </div>
                
                {/* Amenities */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hotelFacilities.map((facility, index) => (
                            <div key={index} className="flex items-center">
                                <div className="text-blue-600 mr-2">
                                    {getAmenityIcon(facility.name)}
                                </div>
                                <span>{facility.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Room types */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Rooms</h2>
                    <div className="space-y-6">
                        {roomTypes.map((room, index) => (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-1/4 mb-4 md:mb-0">
                                        {room.photos && room.photos.length > 0 ? (
                                            <img 
                                                src={room.photos[0].url_original} 
                                                alt={room.name}
                                                className="w-full h-40 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:w-2/4 md:px-4">
                                        <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                                        <div className="mb-2">
                                            <span className="text-gray-600">Room size: </span>
                                            <span>{room.roomSize?.value || 'N/A'} {room.roomSize?.unit || ''}</span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-2">{room.description}</p>
                                        <div className="mt-2">
                                            <span className="font-semibold">Max guests: </span>
                                            <span>{room.maxPersons || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="md:w-1/4 mt-4 md:mt-0 flex flex-col justify-between">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-blue-600">${room.roomPrices?.dailyPrices?.[0]?.price || 'N/A'}</p>
                                            <p className="text-gray-500">per night</p>
                                            <p className="font-semibold mt-1">Total: ${room.roomPrices?.totalPrice || 'N/A'}</p>
                                        </div>
                                        <div className="mt-4 flex flex-col space-y-2">
                                            <button 
                                                onClick={() => handleViewRoomDetails(room)}
                                                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center"
                                            >
                                                <FaInfoCircle className="mr-2" />
                                                View Details
                                            </button>
                                            <button 
                                                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Select Room
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Policies */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Check-in/Check-out</h3>
                            <p><span className="font-medium">Check-in time:</span> {policies.checkIn?.from || 'N/A'}</p>
                            <p><span className="font-medium">Check-out time:</span> {policies.checkOut?.until || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Cancellation</h3>
                            <p>{policies.cancellation?.description || 'Contact the property for cancellation policies.'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Room Details Sidebar */}
            {showRoomDetailsSidebar && selectedRoom && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={closeRoomDetailsSidebar}
                    ></div>
                    
                    {/* Sidebar */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="relative w-screen max-w-md">
                            <div className="h-full bg-white shadow-xl flex flex-col overflow-y-auto">
                                {/* Header */}
                                <div className="px-4 py-6 bg-indigo-600 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">Room Details</h2>
                                    <button 
                                        onClick={closeRoomDetailsSidebar}
                                        className="text-white hover:text-gray-200 focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 px-4 py-6 overflow-y-auto">
                                    {/* Room name */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedRoom.name}</h3>
                                    
                                    {/* Room photos - carousel */}
                                    {selectedRoom.photos && selectedRoom.photos.length > 0 && (
                                        <div className="mb-6">
                                            <div className="w-full h-64 overflow-hidden rounded-lg mb-2">
                                                <img 
                                                    src={selectedRoom.photos[0].url_original} 
                                                    alt={selectedRoom.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            {selectedRoom.photos.length > 1 && (
                                                <div className="flex overflow-x-auto space-x-2 pb-2">
                                                    {selectedRoom.photos.map((photo, photoIndex) => (
                                                        <img 
                                                            key={photoIndex}
                                                            src={photo.url_square60}
                                                            alt={`Room ${photoIndex + 1}`}
                                                            className="w-16 h-16 object-cover rounded cursor-pointer"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Room details */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Room Details</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Room Size</p>
                                                    <p className="text-base">{selectedRoom.roomSize?.value || 'N/A'} {selectedRoom.roomSize?.unit || ''}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Max Guests</p>
                                                    <p className="text-base">{selectedRoom.maxPersons || 'N/A'} people</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Bed Type</p>
                                                    <p className="text-base">{selectedRoom.bedType?.name || 'Standard'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">No. of Beds</p>
                                                    <p className="text-base">{selectedRoom.bedType?.count || '1'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                                                <p className="text-base text-gray-700">{selectedRoom.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Room facilities */}
                                    {selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Room Amenities</h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {selectedRoom.facilities.map((facility, facIdx) => (
                                                        <li key={facIdx} className="flex items-center">
                                                            <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{facility}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Price details */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Price Details</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between mb-2">
                                                <p className="text-gray-600">Price per night:</p>
                                                <div>
                                                    <p className="text-lg font-bold text-right">
                                                        ${selectedRoom.roomPrices?.dailyPrices?.[0]?.price || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 text-right">
                                                        Rs. {Math.floor((selectedRoom.roomPrices?.dailyPrices?.[0]?.price || 0) * USD_TO_PKR_RATE)} PKR
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between mb-2">
                                                <p className="text-gray-600">Stay duration:</p>
                                                <p className="font-medium">{nightsOfStay} {nightsOfStay === 1 ? 'night' : 'nights'}</p>
                                            </div>
                                            
                                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                                <p className="text-gray-800 font-semibold">Total price:</p>
                                                <div>
                                                    <p className="text-xl font-bold text-green-600 text-right">
                                                        ${selectedRoom.roomPrices?.totalPrice || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 text-right">
                                                        Rs. {Math.floor((selectedRoom.roomPrices?.totalPrice || 0) * USD_TO_PKR_RATE)} PKR
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Cancellation policy */}
                                    {selectedRoom.policies && (
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Cancellation Policy</h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-700">
                                                    {selectedRoom.policies.cancellation?.description || 
                                                     "Please contact the property for cancellation policy details."}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Action buttons */}
                                    <div className="pt-4 flex space-x-4">
                                        <button
                                            onClick={closeRoomDetailsSidebar}
                                            className="w-1/2 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-all text-sm font-medium"
                                        >
                                            Close
                                        </button>
                                        <button
                                            className="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                                        >
                                            Book This Room
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelDetails;
