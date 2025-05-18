import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FaStar, FaPlane, FaHotel, FaCalendarAlt, FaMapMarkerAlt, FaFileDownload } from 'react-icons/fa';
import Spinner from '../Components/Spinner';

export default function UserTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserTrips = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Query the user_trip_bookings collection
        const q = query(
          collection(db, 'user_trip_bookings'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const tripPromises = [];
        
        // For each trip booking, get flight and hotel details
        querySnapshot.forEach((tripDoc) => {
          const tripData = tripDoc.data();
          
          const processTrip = async () => {
            // Get flight details
            let flightDetails = null;
            const flightQuery = query(
              collection(db, 'user_flights'),
              where('transactionId', '==', tripData.transactionId)
            );
            const flightSnapshot = await getDocs(flightQuery);
            
            if (!flightSnapshot.empty) {
              flightDetails = flightSnapshot.docs[0].data();
            }
            
            // Get hotel details
            let hotelDetails = null;
            const hotelQuery = query(
              collection(db, 'user_hotels'),
              where('transactionId', '==', tripData.transactionId)
            );
            const hotelSnapshot = await getDocs(hotelQuery);
            
            if (!hotelSnapshot.empty) {
              hotelDetails = hotelSnapshot.docs[0].data();
            }

            // Calculate trip status based on departure date
            let status = 'upcoming';
            if (flightDetails && flightDetails.flightDetails?.departureTime) {
              const departureDate = new Date(flightDetails.flightDetails.departureTime);
              const now = new Date();
              
              if (departureDate < now) {
                status = 'completed';
              } else if (departureDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                status = 'imminent';
              }
            }
            
            return {
              id: tripDoc.id,
              ...tripData,
              flightDetails,
              hotelDetails,
              status
            };
          };
          
          tripPromises.push(processTrip());
        });
        
        // Resolve all promises
        const tripData = await Promise.all(tripPromises);
        
        // Sort trips by booking date (newest first)
        tripData.sort((a, b) => 
          new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        
        setTrips(tripData);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setError("Failed to load your trip bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrips();
  }, []);

  const getStatusTag = (status) => {
    const statusStyles = {
      completed: "bg-gray-500 text-white",
      upcoming: "bg-green-500 text-white",
      imminent: "bg-yellow-500 text-white"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Trip Bookings</h1>
      
      {trips.length === 0 ? (
        <div className="text-center text-gray-600 p-8 bg-gray-100 rounded-lg shadow-md">
          <p className="text-xl mb-4">You haven't booked any trips yet</p>
          <p>Start planning your journey today and book a complete travel package!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {trip.flightDetails?.flightDetails?.departure || 'N/A'} → {trip.flightDetails?.flightDetails?.arrival || 'N/A'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      <FaCalendarAlt className="inline mr-1" />
                      Booked on {formatDate(trip.bookingDate)}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    {getStatusTag(trip.status)}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Flight section */}
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 p-2 rounded-full mr-2">
                      <FaPlane className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Flight Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Departure</p>
                      <p className="text-gray-800">{formatDate(trip.flightDetails?.flightDetails?.departureTime || '')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Arrival</p>
                      <p className="text-gray-800">{formatDate(trip.flightDetails?.flightDetails?.arrivalTime || '')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Flight Number</p>
                      <p className="text-gray-800">{trip.flightDetails?.flightNumber || 'N/A'}</p>
                    </div>                    <div>
                      <p className="text-gray-500 font-medium">Price</p>
                      <p className="text-gray-800 font-bold">RS. {Math.floor(trip.flightDetails?.amount * 280 || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Hotel section */}
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="bg-yellow-100 p-2 rounded-full mr-2">
                      <FaHotel className="text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Hotel Details</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Hotel</p>
                      <p className="text-gray-800 font-semibold">{trip.hotelDetails?.hotelName || 'N/A'}</p>
                    </div>
                    <div>
                      
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-gray-500 font-medium">Check-in</p>
                        <p className="text-gray-800">{formatDate(trip.hotelDetails?.checkIn || '')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Check-out</p>
                        <p className="text-gray-800">{formatDate(trip.hotelDetails?.checkOut || '')}</p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      {trip.hotelDetails?.daysOfStay && (
                        <div>
                          <p className="text-gray-500 font-medium">Stay Duration</p>
                          <p className="text-gray-800">
                            {trip.hotelDetails.daysOfStay} {trip.hotelDetails.daysOfStay === 1 ? 'night' : 'nights'}
                          </p>
                        </div>
                      )}                      {trip.hotelDetails?.pricePerDay && (
                        <div>
                          <p className="text-gray-500 font-medium">Price per night</p>
                          <p className="text-gray-800">RS. {Math.floor(trip.hotelDetails.pricePerDay * 280 )}</p>
                        </div>
                      )}
                    </div>                    <div>
                      <p className="text-gray-500 font-medium">Total Price</p>
                      <p className="text-gray-800 font-bold">
                        RS. {Math.floor(trip.hotelDetails?.totalPrice || trip.hotelDetails?.amount * 280 || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Amount:</p>
                      <p className="text-xl font-bold text-green-600">
                        RS. {Math.floor(trip.totalAmount * 280 || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Paid via {trip.paymentMethod === 'credit' ? 'Credit Card' : 'Debit Card'}
                      </p>
                    </div>
                    {trip.invoiceUrl && (
                      <a
                        href={trip.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FaFileDownload />
                        View Invoice
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Transaction ID */}
                <div className="text-xs text-gray-500 text-center">
                  Transaction ID: {trip.transactionId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
