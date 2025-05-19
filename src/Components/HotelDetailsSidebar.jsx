import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaWifi, FaParking, FaSwimmingPool, FaCoffee, FaUtensils, FaCheck, FaSpinner, FaInfoCircle } from 'react-icons/fa';

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

const HotelDetailsSidebar = ({ 
    hotelId, 
    isOpen, 
    onClose,
    arrivalDate,
    daysOfStay,
    adults,
    childrenAge,
    roomQty,
    onBookNow
}) => {
    const [hotelDetails, setHotelDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    // Format childrenAge array for API request
    const childrenAgeParam = childrenAge && childrenAge.length > 0 ? childrenAge.join(',') : '';
    
    const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
    const API_HOST = "booking-com15.p.rapidapi.com";

    // Get formatted check-out date
    const getCheckoutDate = () => {
        if (!arrivalDate) return '';
        
        const arrival = new Date(arrivalDate);
        const checkout = new Date(arrival);
        checkout.setDate(arrival.getDate() + parseInt(daysOfStay));
        return checkout.toISOString().split('T')[0];
    };
    
    // Calculate departure date
    const departureDate = getCheckoutDate();
    
    // Generate Google Maps link
    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };
    
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
    
    useEffect(() => {
        if (!isOpen || !hotelId) return;
        
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
                setError(null);
                
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
    }, [hotelId, arrivalDate, departureDate, adults, childrenAgeParam, roomQty, isOpen]);
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            ></div>
            
            {/* Sidebar */}
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md">
                    <div className="h-full bg-white shadow-xl flex flex-col overflow-y-auto">
                        {/* Header */}
                        <div className="px-4 py-6 bg-indigo-600 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Hotel Details</h2>
                            <button 
                                onClick={onClose}
                                className="text-white hover:text-gray-200 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 px-4 py-6 overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FaSpinner className="animate-spin text-indigo-600 text-4xl mb-4" />
                                    <p>Loading hotel details...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
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
                            ) : hotelDetails ? (
                                <>
                                    {/* Hotel Image Gallery */}
                                    <div className="mb-6">
                                        {/* Check if we have rawData.photoUrls as in your JSON example */}
                                        {hotelDetails.rawData?.photoUrls && hotelDetails.rawData.photoUrls.length > 0 ? (
                                            <div className="relative">
                                                <img 
                                                    src={hotelDetails.rawData.photoUrls[0]} 
                                                    alt={hotelDetails.hotel_name || hotelDetails.rawData?.name} 
                                                    className="w-full h-64 object-cover rounded-lg"
                                                />
                                            </div>
                                        ) : hotelDetails.hotelPhotos && hotelDetails.hotelPhotos.length > 0 ? (
                                            <div className="relative">
                                                <img 
                                                    src={hotelDetails.hotelPhotos[activeImageIndex]?.url_max || hotelDetails.hotelPhotos[0]?.url_max} 
                                                    alt={hotelDetails.basicPropertyData?.name} 
                                                    className="w-full h-64 object-cover rounded-lg"
                                                />
                                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                    {hotelDetails.hotelPhotos.length} photos
                                                </div>
                                                
                                                {hotelDetails.hotelPhotos.length > 1 && (
                                                    <div className="flex overflow-x-auto space-x-2 mt-2 pb-2">
                                                        {hotelDetails.hotelPhotos.slice(0, 5).map((photo, photoIndex) => (
                                                            <img 
                                                                key={photoIndex}
                                                                src={photo.url_square60}
                                                                alt={`Room ${photoIndex + 1}`}
                                                                className={`w-16 h-16 object-cover rounded cursor-pointer ${activeImageIndex === photoIndex ? 'ring-2 ring-blue-500' : ''}`}
                                                                onClick={() => setActiveImageIndex(photoIndex)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Fallback if no images are found
                                            <div className="bg-gray-200 w-full h-64 rounded-lg flex items-center justify-center">
                                                <p className="text-gray-500">No images available</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Hotel Name and Rating */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {hotelDetails.hotel_name || hotelDetails.rawData?.name || hotelDetails.basicPropertyData?.name || "Hotel Name Not Available"}
                                    </h3>
                                    
                                    <div className="flex items-center mb-4">
                                        <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                            <FaStar className="mr-1" />
                                            <span className="font-bold">
                                                {hotelDetails.reviewScore?.score || hotelDetails.rawData?.reviewScore || "N/A"}
                                            </span>
                                            <span className="mx-1">•</span>
                                            <span>
                                                {hotelDetails.reviewScore?.reviewCount || hotelDetails.rawData?.reviewCount || hotelDetails.review_nr || 0} reviews
                                            </span>
                                        </div>
                                        {(hotelDetails.basicPropertyData?.starRating || hotelDetails.rawData?.propertyClass) && (
                                            <span className="ml-3 text-gray-500">
                                                {hotelDetails.basicPropertyData?.starRating || hotelDetails.rawData?.propertyClass} stars
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Address */}
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Location</h4>
                                        <div className="flex items-start text-gray-600">
                                            <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0" />
                                            <address className="not-italic">
                                                {hotelDetails.address || hotelDetails.rawData?.address || 
                                                 (hotelDetails.location ? 
                                                  `${hotelDetails.location.address || ''}, ${hotelDetails.location.city || ''}, ${hotelDetails.location.country || ''}` :
                                                  "Address not available")}
                                            </address>
                                        </div>
                                        
                                        {/* Google Maps Link - using coordinates from any available source */}
                                        {(hotelDetails.location?.latitude || hotelDetails.latitude || hotelDetails.rawData?.latitude) && (
                                            <a 
                                                href={getGoogleMapsLink(
                                                    hotelDetails.location?.latitude || hotelDetails.latitude || hotelDetails.rawData?.latitude,
                                                    hotelDetails.location?.longitude || hotelDetails.longitude || hotelDetails.rawData?.longitude
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline inline-flex items-center mt-2"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                                </svg>
                                                View on Google Maps
                                            </a>
                                        )}
                                    </div>
                                    
                                    {/* Price Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Price Details</h4>
                                        
                                        {/* Check for prices in various potential locations based on your JSON structure */}
                                        {hotelDetails.roomTypes && hotelDetails.roomTypes.length > 0 ? (
                                            // Standard API response structure
                                            <>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Price per night:</span>
                                                    <span className="font-medium">
                                                        ${Math.floor(hotelDetails.roomTypes[0].roomPrices?.dailyPrices?.[0]?.price || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Duration:</span>
                                                    <span className="font-medium">
                                                        {daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-gray-800 font-semibold">Total price:</span>
                                                    <div className="text-right">
                                                        <div className="font-bold text-green-600">
                                                            ${Math.floor(hotelDetails.roomTypes[0].roomPrices?.totalPrice || 0)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Rs. {Math.floor((hotelDetails.roomTypes[0].roomPrices?.totalPrice || 0) * USD_TO_PKR_RATE)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : hotelDetails.composite_price_breakdown || hotelDetails.product_price_breakdown ? (
                                            // Your JSON example structure
                                            <>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Price per night:</span>
                                                    <span className="font-medium">
                                                        ${Math.floor((hotelDetails.composite_price_breakdown?.gross_amount?.value || 
                                                            hotelDetails.product_price_breakdown?.gross_amount?.value || 0) / daysOfStay)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Duration:</span>
                                                    <span className="font-medium">
                                                        {daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'}
                                                    </span>
                                                </div>
                                                
                                                {/* Display original price if there's a discount */}
                                                {(hotelDetails.composite_price_breakdown?.strikethrough_amount || 
                                                  hotelDetails.product_price_breakdown?.strikethrough_amount) && (
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-gray-600">Original price:</span>
                                                        <span className="line-through text-gray-500">
                                                            ${Math.floor(hotelDetails.composite_price_breakdown?.strikethrough_amount?.value || 
                                                              hotelDetails.product_price_breakdown?.strikethrough_amount?.value || 0)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Display discount badge if available */}
                                                {((hotelDetails.composite_price_breakdown?.benefits && 
                                                   hotelDetails.composite_price_breakdown.benefits.length > 0) ||
                                                  (hotelDetails.product_price_breakdown?.benefits && 
                                                   hotelDetails.product_price_breakdown.benefits.length > 0)) && (
                                                    <div className="flex justify-end mb-2">
                                                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                            {hotelDetails.composite_price_breakdown?.benefits?.[0]?.name || 
                                                             hotelDetails.product_price_breakdown?.benefits?.[0]?.name}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-gray-800 font-semibold">Total price:</span>
                                                    <div className="text-right">
                                                        <div className="font-bold text-green-600">
                                                            ${Math.floor(hotelDetails.composite_price_breakdown?.gross_amount?.value || 
                                                               hotelDetails.product_price_breakdown?.gross_amount?.value || 0)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Rs. {Math.floor((hotelDetails.composite_price_breakdown?.gross_amount?.value || 
                                                                             hotelDetails.product_price_breakdown?.gross_amount?.value || 0) * USD_TO_PKR_RATE)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Display tax information if available */}
                                                {(hotelDetails.composite_price_breakdown?.included_taxes_and_charges_amount || 
                                                  hotelDetails.product_price_breakdown?.included_taxes_and_charges_amount) && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Includes taxes and fees
                                                    </div>
                                                )}
                                            </>
                                        ) : hotelDetails.rawData?.priceBreakdown ? (
                                            // Another potential structure from your JSON
                                            <>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Price per night:</span>
                                                    <span className="font-medium">
                                                        ${Math.floor(hotelDetails.rawData.priceBreakdown.grossPrice.value / daysOfStay)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">Duration:</span>
                                                    <span className="font-medium">
                                                        {daysOfStay} {daysOfStay === 1 ? 'night' : 'nights'}
                                                    </span>
                                                </div>
                                                
                                                {hotelDetails.rawData.priceBreakdown.strikethroughPrice && (
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-gray-600">Original price:</span>
                                                        <span className="line-through text-gray-500">
                                                            ${Math.floor(hotelDetails.rawData.priceBreakdown.strikethroughPrice.value || 0)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {hotelDetails.rawData.priceBreakdown.benefitBadges && 
                                                 hotelDetails.rawData.priceBreakdown.benefitBadges.length > 0 && (
                                                    <div className="flex justify-end mb-2">
                                                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                            {hotelDetails.rawData.priceBreakdown.benefitBadges[0].text || "Special Deal"}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-gray-800 font-semibold">Total price:</span>
                                                    <div className="text-right">
                                                        <div className="font-bold text-green-600">
                                                            ${Math.floor(hotelDetails.rawData.priceBreakdown.grossPrice.value || 0)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Rs. {Math.floor(hotelDetails.rawData.priceBreakdown.grossPrice.value * USD_TO_PKR_RATE)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {hotelDetails.rawData.priceBreakdown.chargesInfo || "Includes taxes and fees"}
                                                </div>
                                            </>
                                        ) : (
                                            // Fallback when no price data is available
                                            <p className="text-gray-500 text-center">Price information not available</p>
                                        )}
                                    </div>
                                    
                                    {/* Hotel Features/Amenities */}
                                    {/* Try to get amenities from different possible structures */}
                                    {(hotelDetails.hotelFacilities || 
                                      hotelDetails.facilities_block || 
                                      hotelDetails.property_highlight_strip || 
                                      hotelDetails.top_ufi_benefits) && (
                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Standard API facilities */}
                                                {hotelDetails.hotelFacilities?.slice(0, 8).map((facility, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <div className="text-blue-600 mr-2">
                                                            {getAmenityIcon(facility.name)}
                                                        </div>
                                                        <span className="text-sm">{facility.name}</span>
                                                    </div>
                                                ))}
                                                
                                                {/* JSON example facilities_block */}
                                                {hotelDetails.facilities_block?.facilities?.slice(0, 8).map((facility, index) => (
                                                    <div key={`fb-${index}`} className="flex items-center">
                                                        <div className="text-blue-600 mr-2">
                                                            {getAmenityIcon(facility.name)}
                                                        </div>
                                                        <span className="text-sm">{facility.name}</span>
                                                    </div>
                                                ))}
                                                
                                                {/* JSON example property_highlight_strip */}
                                                {hotelDetails.property_highlight_strip?.slice(0, 8).map((highlight, index) => (
                                                    <div key={`hl-${index}`} className="flex items-center">
                                                        <div className="text-blue-600 mr-2">
                                                            {getAmenityIcon(highlight.name)}
                                                        </div>
                                                        <span className="text-sm">{highlight.name}</span>
                                                    </div>
                                                ))}
                                                
                                                {/* JSON example top_ufi_benefits */}
                                                {hotelDetails.top_ufi_benefits?.slice(0, 8).map((benefit, index) => (
                                                    <div key={`ben-${index}`} className="flex items-center">
                                                        <div className="text-blue-600 mr-2">
                                                            {getAmenityIcon(benefit.translated_name)}
                                                        </div>
                                                        <span className="text-sm">{benefit.translated_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Show "more amenities" text if there are more than what we're showing */}
                                            {((hotelDetails.hotelFacilities?.length > 8) || 
                                              (hotelDetails.facilities_block?.facilities?.length > 8) ||
                                              (hotelDetails.property_highlight_strip?.length > 8) ||
                                              (hotelDetails.top_ufi_benefits?.length > 8)) && (
                                                <div className="text-sm text-center text-blue-600 mt-2">
                                                    + more amenities available
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Hotel Description */}
                                    {(hotelDetails.hotelDescription?.description || hotelDetails.hotel_text) && (
                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                                            <p className="text-gray-700 text-sm">
                                                {hotelDetails.hotelDescription?.description || 
                                                 (hotelDetails.hotel_text ? Object.values(hotelDetails.hotel_text)[0] : "")}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Room Information */}
                                    {(hotelDetails.rooms || hotelDetails.roomTypes) && (
                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Room Information</h4>
                                            
                                            {hotelDetails.rooms ? (
                                                // For the JSON example format
                                                Object.values(hotelDetails.rooms).map((room, index) => (
                                                    <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                                                        <p className="font-medium">{room.description?.substring(0, 100)}{room.description?.length > 100 ? '...' : ''}</p>
                                                        {room.facilities && room.facilities.slice(0, 5).map((facility, i) => (
                                                            <div key={i} className="flex items-center text-sm mt-1">
                                                                <FaCheck className="text-green-500 mr-1 flex-shrink-0" size={12} />
                                                                <span>{facility.name}</span>
                                                            </div>
                                                        ))}
                                                        {room.facilities?.length > 5 && (
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                +{room.facilities.length - 5} more features
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : hotelDetails.roomTypes && (
                                                // For the standard API format
                                                hotelDetails.roomTypes.slice(0, 3).map((room, index) => (
                                                    <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow mb-2">
                                                        <h5 className="font-bold text-gray-800">{room.name}</h5>
                                                        <div className="flex justify-between items-center mt-2 text-sm">
                                                            <span>Max guests: {room.maxPersons || 'N/A'}</span>
                                                            <span className="font-semibold text-green-600">
                                                                ${Math.floor(room.roomPrices?.dailyPrices?.[0]?.price || 0)}/night
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Check-in/Check-out Info */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Check-in/out Information</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Check-in</p>
                                                <p className="text-sm">
                                                    {hotelDetails.policies?.checkIn?.from || 
                                                     hotelDetails.checkin?.fromTime || "2:00 PM"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Check-out</p>
                                                <p className="text-sm">
                                                    Until {hotelDetails.policies?.checkOut?.until || 
                                                           hotelDetails.checkout?.untilTime || "11:00 AM"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Important Information */}
                                    {hotelDetails.hotel_important_information_with_codes && 
                                     hotelDetails.hotel_important_information_with_codes.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Important Information</h4>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                {hotelDetails.hotel_important_information_with_codes.map((info, index) => (
                                                    <p key={index} className="text-sm mb-2">{info.phrase}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Actions */}
                                    <div className="flex pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                // Just pass the hotel details to the parent component
                                                // and let it handle the booking logic
                                                onClose();
                                                if (typeof onBookNow === 'function') {
                                                    onBookNow(hotelDetails);
                                                }
                                            }}
                                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-500">
                                    No hotel details available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelDetailsSidebar;
