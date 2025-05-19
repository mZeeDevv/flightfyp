import React, { useState, useEffect } from "react";
import { FaHotel, FaSearch, FaSpinner, FaStar, FaTimes, FaCreditCard, FaFileDownload, FaInfoCircle } from "react-icons/fa";
import "../App.css";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
// Remove Firebase Storage import
import HotelDetailsSidebar from "../Components/HotelDetailsSidebar";

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;
import { toast } from "react-toastify";
import { PDFDownloadLink } from "@react-pdf/renderer";
// Remove Firebase Storage related imports
import { pdf } from "@react-pdf/renderer";
import HotelInvoicePDF from "../Components/HotelInvoicePDF";
import { useNavigate } from "react-router-dom";
import { logUserActivity } from "../services/LoggingService"; // Import logging service
import Hotel from '../../src/assets/Hotel.jpg'

export default function HotelSearch() {
    // Remove Firebase storage reference
    const [destination, setDestination] = useState("");
    const [destId, setDestId] = useState("");
    const [adults, setAdults] = useState(1);
    const [childrenAge, setChildrenAge] = useState([]);
    const [roomQty, setRoomQty] = useState(1);
    const [arrivalDate, setArrivalDate] = useState("");
    const [daysOfStay, setDaysOfStay] = useState(1);
    const [hotelData, setHotelData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    
    // Payment and booking related states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCVC, setCardCVC] = useState("");
    const [cardName, setCardName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("debit");
    const [bookingComplete, setBookingComplete] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [transactionId, setTransactionId] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState("");
    const [uploadingInvoice, setUploadingInvoice] = useState(false);
    
    // Hotel details sidebar state
    const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
    const [detailsHotelId, setDetailsHotelId] = useState(null);

    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";
    const navigate = useNavigate();
    const uid = localStorage.getItem("userId");
    
    // Fetch destination suggestions
    const fetchDestinationSuggestions = async (query) => {
        if (!query) {
            setDestinationSuggestions([]);
            return;
        }

        const url = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${query}`;
        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": API_HOST,
            },
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                console.error("Error fetching suggestions:", response.status);
                return;
            }
            
            const result = await response.json();
            
            if (result?.data?.length > 0) {
                // Filter out hotel suggestions, only keep cities
                const filteredResults = result.data.filter(suggestion => {
                    // Only keep items that are cities, regions, airports, not hotels
                    // Check search_type or desc_type properties
                    if (suggestion.search_type && suggestion.search_type.toUpperCase() === "HOTEL") {
                        return false;
                    }
                    
                    // Check if dest_type is available and contains "hotel"
                    if (suggestion.dest_type && suggestion.dest_type.toLowerCase().includes("hotel")) {
                        return false;
                    }
                    
                    // Check name property for hotel indicators
                    if (suggestion.name && (
                        suggestion.name.toLowerCase().includes(" hotel") ||
                        suggestion.name.toLowerCase().includes("resort") ||
                        suggestion.name.toLowerCase().includes("inn") ||
                        suggestion.name.toLowerCase().includes("suites")
                    )) {
                        return false;
                    }
                    
                    return true;
                });
                
                console.log(`Filtered destination suggestions: ${filteredResults.length} cities/regions from ${result.data.length} total results`);
                setDestinationSuggestions(filteredResults);
            } else {
                setDestinationSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching destination suggestions:", error);
            console.error("Error details:", error.message);
            setDestinationSuggestions([]);
        }
    };

    // Handle destination input change
    const handleDestinationChange = (e) => {
        const query = e.target.value;
        setDestination(query);
        fetchDestinationSuggestions(query);
    };

    // Handle selection of a destination suggestion
    const handleSuggestionClick = (suggestion) => {
        setDestination(suggestion.name);
        setDestId(suggestion.dest_id);
        console.log("Selected destination ID:", suggestion.dest_id);
        setDestinationSuggestions([]);
    };

    // Handle hotel search
    const handleSearch = async () => {
        setLoading(true);
        setError("");
        setHotelData(null);

        if (!destId || !arrivalDate || daysOfStay < 1) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        // Log destination ID when searching
        console.log("Searching with destination ID:", destId);

        // Calculate departure date based on arrival date and days of stay
        const arrival = new Date(arrivalDate);
        const departure = new Date(arrival);
        departure.setDate(arrival.getDate() + parseInt(daysOfStay));
        const departureDate = departure.toISOString().split('T')[0];
        
        const url = new URL(`https://${API_HOST}/api/v1/hotels/searchHotels`);
        url.searchParams.append("dest_id", destId);
        url.searchParams.append("search_type", "CITY");  // Always use CITY for consistent results
        url.searchParams.append("adults", adults);
        url.searchParams.append("children_age", childrenAge.join(","));
        url.searchParams.append("room_qty", roomQty);
        url.searchParams.append("arrival_date", arrivalDate);
        url.searchParams.append("departure_date", departureDate);
        url.searchParams.append("page_number", 1);
        url.searchParams.append("units", "metric");
        url.searchParams.append("temperature_unit", "c");
        url.searchParams.append("languagecode", "en-us");
        url.searchParams.append("currency_code", "USD");

        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": API_HOST,
            },
        };
        
        // Debug: Log request details
        console.log("API Request URL:", url.toString());
        console.log("API Request Headers:", options.headers);
        console.log("Search Parameters:", {
            destId,
            searchType: "HOTEL",
            adults,
            childrenAge: childrenAge.join(","),
            roomQty,
            arrivalDate,
            departureDate,
            daysOfStay
        });

        try {
            console.log("Sending API request...");
            const response = await fetch(url, options);
            console.log("API Response Status:", response.status);
            // Log headers for debugging
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            console.log("API Response Headers:", responseHeaders);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }
            const data = await response.json();
            console.log("API Response Data (sample):", {
                status: data.status,
                message: data.message,
                count: data.data?.hotels?.length || 0
            });
            setHotelData(data);
        } catch (err) {
            console.error("API Request Failed:", err);
            console.error("Error Stack:", err.stack);
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Generate Google Maps link
    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    // Fix input values to prevent NaN errors
    const handleAdultsChange = (e) => {
        const value = e.target.value;
        setAdults(value === '' ? '' : Math.max(1, parseInt(value) || 1));
    };
    
    const handleRoomQtyChange = (e) => {
        const value = e.target.value;
        setRoomQty(value === '' ? '' : Math.max(1, parseInt(value) || 1));
    };
    
    const handleDaysOfStayChange = (e) => {
        const value = e.target.value;
        setDaysOfStay(value === '' ? '' : Math.max(1, parseInt(value) || 1));
    };
    
    const handleChildrenAgeChange = (e) => {
        const input = e.target.value;
        if (input === '') {
            setChildrenAge([]);
            return;
        }
        
        const ages = input.split(',')
            .map(age => age.trim())
            .filter(age => age !== '')
            .map(age => {
                const parsed = parseInt(age);
                return isNaN(parsed) ? 0 : parsed;
            });
        setChildrenAge(ages);
    };

    // Format card number with spaces
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        
        for (let i = 0; i < match.length; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // Format card expiry with slash
    const formatCardExpiry = (value) => {
        const cleanValue = value.replace(/[^\d]/g, '');
        if (cleanValue.length <= 2) {
            return cleanValue;
        }
        
        let month = cleanValue.substr(0, 2);
        let year = cleanValue.substr(2);
        // Validate month
        if (parseInt(month) > 12) {
            month = '12';
        }
        
        return `${month}/${year}`;
    };

    // Handle card number input
    const handleCardNumberChange = (e) => {
        const formattedValue = formatCardNumber(e.target.value);
        setCardNumber(formattedValue);
    };
    
    // Handle card expiry input
    const handleCardExpiryChange = (e) => {
        const formattedValue = formatCardExpiry(e.target.value);
        setCardExpiry(formattedValue);
    };

    // Close payment modal and reset states
    const closePaymentModal = () => {
        if (bookingComplete) {
            setShowPaymentModal(false);
            setBookingComplete(false);
            setSelectedHotel(null);
            setCardNumber("");
            setCardExpiry("");
            setCardCVC("");
            setCardName("");
        } else {
            setShowPaymentModal(false);
        }
    };

    // Navigate to bookings page
    const goToBookings = () => {
        navigate("/my-hotels");
    };
    
    // Get formatted check-out date
    const getCheckoutDate = () => {
        if (!arrivalDate) return '';
        
        const arrival = new Date(arrivalDate);
        const checkout = new Date(arrival);
        checkout.setDate(arrival.getDate() + parseInt(daysOfStay));
        return checkout.toISOString().split('T')[0];
    };

    // Component did mount effect to check API key
    React.useEffect(() => {
        if (!RAPIDAPI_KEY || RAPIDAPI_KEY === "undefined") {
            console.error("API Key is missing or invalid. Check your environment variables.");
            setError("API Key configuration error. Please check the console for details.");
        } else {
            console.log("API Key is configured");
        }
    }, []);

    // Book hotel function - Define this BEFORE handleBookHotelFromDetails
    const handleBookHotel = (hotel) => {
        if (!uid) {
            toast.error("Please login to book a hotel");
            return;
        }
        
        setSelectedHotel(hotel);
        setShowPaymentModal(true);  
    };

    // Function to handle viewing hotel details
    const handleViewHotelDetails = (hotel) => {
        setDetailsHotelId(hotel.hotel_id);
        setShowDetailsSidebar(true);
    };

    // Handle hotel booking from the details sidebar
    const handleBookHotelFromDetails = (hotelDetails) => {
        // Find the hotel in our existing data
        const hotel = hotelData?.data?.hotels?.find(h => h.hotel_id === detailsHotelId);
        
        if (hotel) {
            handleBookHotel(hotel);
        } else {
            // If we can't find the hotel in our existing data, create a booking object from the details
            const roomType = hotelDetails.roomTypes?.[0];
            const bookingHotel = {
                hotel_id: hotelDetails.hotel_id || detailsHotelId,
                property: {
                    name: hotelDetails.basicPropertyData?.name || hotelDetails.hotel_name,
                    address: hotelDetails.location?.address || hotelDetails.address,
                    priceBreakdown: {
                        grossPrice: {
                            value: roomType?.roomPrices?.totalPrice || 
                                   hotelDetails.composite_price_breakdown?.gross_amount?.value ||
                                   hotelDetails.product_price_breakdown?.gross_amount?.value || 0
                        }
                    },
                    reviewScore: hotelDetails.reviewScore?.score || hotelDetails.review_nr,
                    photoUrls: hotelDetails.hotelPhotos?.map(photo => photo.url_max) || 
                               hotelDetails.rawData?.photoUrls || 
                               [hotelDetails.rooms?.[Object.keys(hotelDetails.rooms)[0]]?.photos?.[0]?.url_original],
                    latitude: hotelDetails.location?.latitude || hotelDetails.latitude,
                    longitude: hotelDetails.location?.longitude || hotelDetails.longitude
                }
            };
            handleBookHotel(bookingHotel);
        }
    };

    // Generate random transaction ID
    const generateTransactionId = () => {
        return 'HTL-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    // Handle payment processing
    const processPayment = async (e) => {
        e.preventDefault();
        setProcessingPayment(true);
        setError("");
        
        // Generate a transaction ID
        const transactionId = generateTransactionId();
        setTransactionId(transactionId);

        // Prepare booking data with the structure expected by the HotelInvoicePDF component
        const bookingDetails = {
            transactionId,
            userId: uid,
            hotelId: selectedHotel.hotel_id,
            hotel: {
                id: selectedHotel.hotel_id,
                name: selectedHotel.property.name,
                location: selectedHotel.property.address || "",
                pricePerNight: Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value / daysOfStay),
                totalPrice: Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value),
                daysOfStay: daysOfStay,
                checkInDate: arrivalDate,
                checkOutDate: getCheckoutDate(),
                rating: selectedHotel.property.reviewScore || "N/A",
                imageUrl: selectedHotel.property.photoUrls[0] || "",
            },
            roomQty,
            adults,
            childrenAge,
            arrivalDate,
            departureDate: getCheckoutDate(),
            totalAmount: Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value),
            paymentMethod,
            status: "pending",
            createdAt: new Date().toISOString()
        };
        setBookingData(bookingDetails);

        try {
            // 1. Add booking record to Firestore
            const bookingDocRef = await addDoc(collection(db, "user_hotels"), bookingDetails);
            console.log("Booking record created with ID:", bookingDocRef.id);
            
            // 2. Generate and upload invoice PDF to Cloudinary
            const invoicePdfBlob = await pdf(
                <HotelInvoicePDF 
                    bookingDetails={{
                        ...bookingDetails,
                        customerName: cardName,
                    }} 
                    transactionId={transactionId}
                    paymentMethod={paymentMethod}
                />
            ).toBlob();
            
            setUploadingInvoice(true);
            
            // Upload PDF to Cloudinary
            const pdfUrl = await uploadPdfToCloudinary(invoicePdfBlob, transactionId);
            setInvoiceUrl(pdfUrl);
            setUploadingInvoice(false);
            
            // 3. Update booking record with Cloudinary invoice URL and change status to 'confirmed'
            await updateDoc(doc(db, "user_hotels", bookingDocRef.id), {
                invoiceUrl: pdfUrl,
                status: "confirmed",
                updatedAt: new Date().toISOString()
            });
            
            // 4. No need to add another duplicate record to user_hotels collection, update the existing one instead
            console.log("User hotel booking record updated with Cloudinary invoice URL");
            
            // Show success and mark booking as complete
            setBookingComplete(true);
            setProcessingPayment(false);
            toast.success("Hotel booking successful!");
            
        } catch (error) {
            console.error("Error processing payment:", error);
            setError("Error processing payment. Please try again.");
            setProcessingPayment(false);
            toast.error("Failed to process booking. Please try again.");
        }
    };

    // Function to upload PDF to Cloudinary
    const uploadPdfToCloudinary = async (pdfBlob, transactionId) => {
        const cloudName = import.meta.env.VITE_CLOUDNAME;
        const apiKey = import.meta.env.VITE_API_KEY_C;
        const apiSecret = import.meta.env.VITE_API_KEY_SECRET_C;
        
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const formData = new FormData();
            
            // Convert the blob to a file with a specific name
            const file = new File([pdfBlob], `hotel_invoice_${transactionId}.pdf`, { type: 'application/pdf' });
            formData.append("file", file);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp);
            formData.append("folder", `hotel_invoices`);
            
            // Generate signature for Cloudinary
            const generateSignature = async (params) => {
                const crypto = await import('crypto-js');
                const stringToSign = Object.keys(params)
                    .sort()
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                
                return crypto.SHA1(stringToSign + apiSecret).toString();
            };
            
            const signature = await generateSignature({
                timestamp: timestamp,
                folder: 'hotel_invoices',
            });
            
            formData.append("signature", signature);
            
            console.log("Uploading hotel PDF to Cloudinary...");
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
                method: "POST",
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error("Cloudinary error details:", data);
                throw new Error(`Cloudinary upload failed: ${data.error.message}`);
            }
            
            console.log("Hotel PDF uploaded successfully to Cloudinary:", data);
            console.log("PDF URL:", data.secure_url);
            console.log("PDF location in Cloudinary:", `hotel_invoices/hotel_invoice_${transactionId}.pdf`);
            
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading hotel PDF to Cloudinary:", error);
            throw error;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${Hotel})` }}>
            <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-4 animate-slideUp transition-all duration-500">
                <h1 className="text-3xl font-bold text-center mb-6">Find Your Perfect Hotel</h1>
                
                {/* Search Form - Reorganized into a 3-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Destination Input - Full width */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Destination
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={destination}
                                onChange={handleDestinationChange}
                                placeholder="Enter destination"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {destinationSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {destinationSuggestions.map((suggestion) => (
                                        <li
                                            key={suggestion.dest_id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* First row: 3 columns */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Arrival Date
                        </label>
                        <input
                            type="date"
                            value={arrivalDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setArrivalDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Days of Stay
                        </label>
                        <input
                            type="number"
                            value={daysOfStay}
                            onChange={handleDaysOfStayChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rooms
                        </label>
                        <input
                            type="number"
                            value={roomQty}
                            onChange={handleRoomQtyChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Second row: Adults and Children Ages */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adults
                        </label>
                        <input
                            type="number"
                            value={adults}
                            onChange={handleAdultsChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Children Ages (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={childrenAge.join(",")}
                            onChange={handleChildrenAgeChange}
                            placeholder="e.g., 5, 10"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Search Button - Full width */}
                <button
                    onClick={handleSearch}
                    disabled={loading || !destId || !arrivalDate || daysOfStay < 1}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                        loading || !destId || !arrivalDate || daysOfStay < 1
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
                            <FaSearch className="mr-2" /> Find Hotels
                        </>
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                        <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            {error}
                        </p>
                    </div>
                )}

                {/* Hotel Results */}
                {hotelData && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Hotel Options</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotelData.data.hotels.map((hotel) => (
                                <div key={hotel.hotel_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <img
                                        src={hotel.property.photoUrls[0]}
                                        alt={hotel.property.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold mb-2">{hotel.property.name}</h3>
                                        <div className="flex items-center mb-2">
                                            <FaStar className="text-yellow-500 mr-1" />
                                            <span className="text-gray-700">
                                                {hotel.property.reviewScore} ({hotel.property.reviewCount} reviews)
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-1">
                                            ${Math.floor(hotel.property.priceBreakdown.grossPrice.value / daysOfStay)} USD / 
                                            Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value / daysOfStay) * USD_TO_PKR_RATE} PKR per night
                                        </p>
                                        <p className="text-gray-800 font-bold mb-2">
                                            ${Math.floor(hotel.property.priceBreakdown.grossPrice.value)} USD / 
                                            Rs. {Math.floor(hotel.property.priceBreakdown.grossPrice.value) * USD_TO_PKR_RATE} PKR total 
                                            ({daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'})
                                        </p>
                                        <a
                                            href={getGoogleMapsLink(hotel.property.latitude, hotel.property.longitude)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View on Google Maps
                                        </a>
                                        <div className="flex mt-4 space-x-2">
                                            <button 
                                                onClick={() => handleViewHotelDetails(hotel)} 
                                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center"
                                            >
                                                <FaInfoCircle className="mr-1" /> VIEW DETAILS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-gray-200 p-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {bookingComplete ? "Booking Confirmed" : "Complete Your Booking"}
                            </h3>
                            <button 
                                onClick={closePaymentModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4">
                            {bookingComplete ? (
                                // Booking complete view
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Your Hotel is Booked!</h3>
                                    <p className="text-gray-600 mb-4">Transaction ID: {transactionId}</p>
                                    <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
                                        <h4 className="font-bold text-gray-700 mb-2">{selectedHotel.property.name}</h4>
                                        <p className="text-sm text-gray-600 mb-1">Check-in: {arrivalDate}</p>
                                        <p className="text-sm text-gray-600 mb-1">Check-out: {getCheckoutDate()}</p>
                                        <p className="text-sm text-gray-600 mb-1">Duration: {daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'}</p>                                        <p className="text-sm font-bold text-gray-800">
                                            Total: ${Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value)} USD / 
                                            Rs. {Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value) * USD_TO_PKR_RATE} PKR
                                        </p>
                                    </div>
                                    
                                    <div className="flex justify-between mb-4">
                                        {uploadingInvoice ? (
                                            <div className="text-blue-600 flex items-center">
                                                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                                                Preparing Invoice...
                                            </div>
                                        ) : invoiceUrl ? (
                                            <a
                                                href={invoiceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                <FaFileDownload className="mr-2" />
                                                Download Invoice
                                            </a>
                                        ) : (
                            bookingData && (
                                                <PDFDownloadLink
                                                    document={
                                                        <HotelInvoicePDF 
                                                            bookingDetails={{
                                                                ...bookingData,
                                                                customerName: cardName
                                                            }} 
                                                            transactionId={transactionId}
                                                            paymentMethod={paymentMethod}
                                                        />
                                                    }
                                                    fileName={`hotel-booking-${transactionId}.pdf`}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    {({ loading }) => (
                                                        <>
                                                            <FaFileDownload className="mr-2" />
                                                            {loading ? 'Generating Invoice...' : 'Download Invoice'}
                                                        </>
                                                    )}
                                                </PDFDownloadLink>
                                            )
                                        )}
                                        <button
                                            onClick={goToBookings}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            View My Bookings
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Payment form
                                <form onSubmit={processPayment}>
                                    {selectedHotel && (
                                        <div className="mb-4 bg-gray-100 p-3 rounded-lg">
                                            <h4 className="font-bold text-gray-800">{selectedHotel.property.name}</h4>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-sm text-gray-600">
                                                    {daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'} 
                                                    ({arrivalDate} - {getCheckoutDate()})
                                                </span>                                                <span className="font-bold text-gray-800">
                                                    ${Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value)} USD / 
                                                    Rs. {Math.floor(selectedHotel.property.priceBreakdown.grossPrice.value) * USD_TO_PKR_RATE} PKR
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex mb-4">
                                        <div className="flex items-center mr-4">
                                            <input
                                                id="debit"
                                                type="radio"
                                                name="payment-method"
                                                className="h-4 w-4 text-blue-600"
                                                checked={paymentMethod === "debit"}
                                                onChange={() => setPaymentMethod("debit")}
                                            />
                                            <label htmlFor="debit" className="ml-2 text-sm text-gray-700">
                                                Debit Card
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="credit"
                                                type="radio"
                                                name="payment-method"
                                                className="h-4 w-4 text-blue-600"
                                                checked={paymentMethod === "credit"}
                                                onChange={() => setPaymentMethod("credit")}
                                            />
                                            <label htmlFor="credit" className="ml-2 text-sm text-gray-700">
                                                Credit Card
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Card Number
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={cardNumber}
                                                onChange={handleCardNumberChange}
                                                placeholder="1234 5678 9012 3456"
                                                maxLength="19"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <FaCreditCard className="absolute right-3 top-2.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expiry Date
                                            </label>
                                            <input
                                                type="text"
                                                value={cardExpiry}
                                                onChange={handleCardExpiryChange}
                                                placeholder="MM/YY"
                                                maxLength="5"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                CVC
                                            </label>
                                            <input
                                                type="text"
                                                value={cardCVC}
                                                onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                placeholder="123"
                                                maxLength="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name on Card
                                        </label>
                                        <input
                                            type="text"
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processingPayment}
                                        className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
                                            processingPayment ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {processingPayment ? (
                                            <>
                                                <FaSpinner className="animate-spin h-5 w-5 mr-3" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Complete Booking"
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hotel Details Sidebar using the HotelDetailsSidebar component */}
            <HotelDetailsSidebar
                hotelId={detailsHotelId}
                isOpen={showDetailsSidebar}
                onClose={() => setShowDetailsSidebar(false)}
                arrivalDate={arrivalDate}
                daysOfStay={daysOfStay}
                adults={adults}
                childrenAge={childrenAge}
                roomQty={roomQty}
                onBookNow={handleBookHotelFromDetails}
            />
        </div>
    );
}