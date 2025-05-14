import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaStar, FaPlane, FaHotel, FaTrash, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../Components/Spinner';
import BookTrip from '../Components/BookTrip';

export default function FavoriteTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = localStorage.getItem("userId");

  useEffect(() => {
    async function fetchFavoriteTrips() {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const tripsRef = collection(db, "user_fav_trips");
        const q = query(
          tripsRef,
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tripsData = [];
        
        querySnapshot.forEach((doc) => {
          tripsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setTrips(tripsData);
      } catch (error) {
        console.error("Error fetching favorite trips:", error);
        toast.error("Failed to load your favorite trips");
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteTrips();
  }, [uid]);

  const handleDeleteTrip = async (tripId) => {
    // Ask for confirmation before deleting
    if (!confirm("Are you sure you want to remove this trip from your favorites?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete the document from Firestore
      await deleteDoc(doc(db, "user_fav_trips", tripId));
      
      // Update the local state to remove the deleted trip
      setTrips(trips.filter(trip => trip.id !== tripId));
      
      toast.success("Trip removed from favorites");
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error("Failed to remove trip from favorites");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Add function to check if flight date has passed
  const isFlightDatePassed = (departureTime) => {
    if (!departureTime) return false;
    try {
      const departureDate = new Date(departureTime);
      const today = new Date();
      return departureDate < today;
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Favorite Trips</h1>

      {trips.length === 0 ? (
        <div className="text-center text-gray-600 p-8 bg-gray-100 rounded-lg shadow-md">
          <p className="text-xl mb-4">You don't have any favorite trips yet</p>
          <p>Plan a trip and add it to your favorites to see it here!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {trip.flight?.departure || 'N/A'} → {trip.flight?.arrival || 'N/A'}
                  </h2>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    <FaCalendarAlt className="inline mr-1" />
                    {formatDate(trip.createdAt)}
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
                      <p className="text-gray-500 font-medium">From</p>
                      <p className="text-gray-800">{trip.flight?.departure || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">To</p>
                      <p className="text-gray-800">{trip.flight?.arrival || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Departure</p>
                      <p className="text-gray-800">{trip.flight?.departureTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Arrival</p>
                      <p className="text-gray-800">{trip.flight?.arrivalTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Flight Number</p>
                      <p className="text-gray-800">{trip.flight?.flightNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Price</p>
                      <p className="text-gray-800 font-bold">RS. {Math.floor(trip.flight?.amount || 0)}</p>
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
                      <p className="text-gray-500 font-medium">Name</p>
                      <p className="text-gray-800 font-semibold">{trip.hotel?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Location</p>
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-gray-400 mt-1 mr-1 flex-shrink-0" />
                        <p className="text-gray-800">{trip.hotel?.location || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-gray-500 font-medium">Rating</p>
                        <div className="flex items-center">
                          <FaStar className="text-yellow-500 mr-1" />
                          <span className="text-gray-800">{trip.hotel?.rating || 'N/A'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Stay Duration</p>
                        <p className="text-gray-800">{trip.hotel?.daysOfStay || 1} {trip.hotel?.daysOfStay === 1 ? 'night' : 'nights'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-gray-500 font-medium">Price per night</p>
                        <p className="text-gray-800">RS. {Math.floor(trip.hotel?.pricePerDay || trip.hotel?.price || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Total price</p>
                        <p className="text-gray-800 font-bold">RS. {Math.floor(trip.hotel?.totalPrice || (trip.hotel?.price || 0) * (trip.hotel?.daysOfStay || 1))}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Package Price:</p>                      <p className="text-xl font-bold text-green-600">
                        RS. {Math.floor((trip.flight?.amount || 0) + (trip.hotel?.totalPrice || trip.hotel?.price || 0))}
                      </p>
                    </div>
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-200 hover:scale-110" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrip(trip.id);
                      }}
                      aria-label="Delete trip"
                      title="Remove from favorites"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-2 pt-2">
                  {isFlightDatePassed(trip.flight?.departureTime) ? (
                    <div className="w-full text-center py-2 px-4 bg-gray-100 text-red-600 rounded font-medium">
                      Flight date has passed - Booking unavailable
                    </div>
                  ) : (
                    <BookTrip 
                      tripData={trip} 
                      onSuccess={() => toast.success("Trip booked successfully!")}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
