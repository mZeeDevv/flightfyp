import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FaHotel, FaCalendarAlt, FaStar, FaDownload, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../Components/Spinner";

// Define USD to PKR conversion rate
const USD_TO_PKR_RATE = 280;

export default function UserHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const uid = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserHotels = async () => {
      if (!uid) {
        setError("Please log in to view your hotel bookings");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const hotelsRef = collection(db, "user_hotels");
        const q = query(
          hotelsRef,
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );

        const querySnap = await getDocs(q);
        const hotelsList = [];

        querySnap.forEach((doc) => {
          const hotelData = doc.data();
          // Validate hotel data structure before adding to list
          if (hotelData && hotelData.hotel) {
            hotelsList.push({
              id: doc.id,
              ...hotelData,
            });
          } else {
            console.warn("Skipping invalid hotel booking record:", doc.id);
          }
        });

        console.log("Fetched hotel bookings:", hotelsList);
        setHotels(hotelsList);
      } catch (error) {
        console.error("Error fetching hotel bookings:", error);
        setError("Failed to load your hotel bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchUserHotels();
  }, [uid]);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Invalid date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return "Invalid date";
    }
  };

  // Calculate checkout date with error handling
  const calculateCheckoutDate = (checkInDate, daysOfStay) => {
    if (!checkInDate) return "N/A";
    
    try {
      const date = new Date(checkInDate);
      if (isNaN(date.getTime())) return "Invalid date";
      
      // Ensure daysOfStay is a valid number
      const days = parseInt(daysOfStay);
      if (isNaN(days)) return "Invalid duration";
      
      date.setDate(date.getDate() + days);
      return formatDate(date);
    } catch (error) {
      console.warn("Error calculating checkout date:", error);
      return "N/A";
    }
  };

  // Function to safely format prices
  const formatPrice = (price, currency = "PKR") => {
    // Handle undefined, null or NaN values
    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      return currency === "PKR" ? "RS. 0" : "$0";
    }
    
    const numericPrice = parseFloat(price);
    
    if (currency === "PKR") {
      // Ensure we multiply by the conversion rate for PKR
      return `RS. ${Math.floor(numericPrice * USD_TO_PKR_RATE).toLocaleString()}`;
    } else {
      return `$${numericPrice.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <Link
            to="/hotels"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search for Hotels
          </Link>
        </div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <FaHotel className="text-blue-600 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Hotel Bookings Found</h2>
          <p className="text-gray-600 mb-6">
            You haven't booked any hotels yet. Start your journey by finding the perfect stay!
          </p>
          <Link
            to="/hotels"
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all inline-block"
          >
            Find Hotels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          My Hotel Bookings
        </h1>
        <p className="text-gray-600 text-center mb-6">
          You have {hotels.length} hotel {hotels.length === 1 ? "booking" : "bookings"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Hotel image section with safe access */}
              {hotel.hotel?.imageUrl ? (
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={hotel.hotel.imageUrl}
                    alt={hotel.hotel?.name || "Hotel"}
                    className="w-full h-full object-cover"
                  />
                  {/* Display payment status if available */}
                  {hotel.paymentDetails?.paymentStatus && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 m-2 rounded-full text-xs font-medium">
                      {hotel.paymentDetails.paymentStatus}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <FaHotel className="text-gray-400 text-5xl" />
                </div>
              )}

              <div className="p-5">
                <h2 className="text-xl font-bold mb-2 text-gray-800">{hotel.hotel?.name || "Unknown Hotel"}</h2>
                
                
                
                <div className="flex items-center mb-3">
                  <FaStar className="text-yellow-500 mr-2" />
                  <p className="text-sm text-gray-600">{hotel.hotel?.rating || "Not rated"}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium">Check-in:</span>
                    </div>
                    <span className="text-sm">{formatDate(hotel.hotel?.checkInDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-red-500 mr-2" />
                      <span className="text-sm font-medium">Check-out:</span>
                    </div>
                    <span className="text-sm">
                      {calculateCheckoutDate(hotel.hotel?.checkInDate, hotel.hotel?.daysOfStay)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Booked on: <span className="font-medium">{formatDate(hotel.createdAt)}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Transaction ID: <span className="font-medium">{hotel.transactionId || "N/A"}</span>
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-gray-600">Price per night</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatPrice(hotel.hotel?.pricePerDay || hotel.hotel?.pricePerNight)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-gray-600">Stay duration</span>
                    <span className="text-sm font-medium text-gray-800">
                      {hotel.hotel?.daysOfStay || 1} {(hotel.hotel?.daysOfStay || 1) === 1 ? "night" : "nights"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-blue-600">{formatPrice(hotel.hotel?.totalPrice)}</span>
                  </div>
                </div>

                {hotel.invoiceUrl && (
                  <a
                    href={hotel.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors w-full"
                  >
                    <FaDownload className="mr-2" /> Download Invoice
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/hotels"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all"
          >
            Book Another Hotel
          </Link>
        </div>
      </div>
    </div>
  );
}
