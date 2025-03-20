import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function UserFlights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserFlights = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'user_flights'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const flightData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const departureDate = new Date(data.flightDetails.departureTime);
          const now = new Date();
          
          let status = 'upcoming';
          if (departureDate < now) {
            status = 'completed';
          } else if (departureDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
            status = 'imminent';
          }

          flightData.push({
            id: doc.id,
            ...data,
            status
          });
        });

        // Sort flights by departure time
        flightData.sort((a, b) => 
          new Date(a.flightDetails.departureTime) - new Date(b.flightDetails.departureTime)
        );

        setFlights(flightData);
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserFlights();
  }, []);

  const getStatusTag = (status) => {
    const statusStyles = {
      completed: "bg-gray-500 text-white",
      upcoming: "bg-green-500 text-white",
      imminent: "bg-yellow-500 text-white"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-sm ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Flight Bookings</h1>
      {flights.length === 0 ? (
        <p className="text-gray-600">No flight bookings found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flights.map((flight) => (
            <div key={flight.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {flight.flightDetails.departure} → {flight.flightDetails.arrival}
                  </h2>
                </div>
                {getStatusTag(flight.status)}
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Departure:</span>{' '}
                  {new Date(flight.flightDetails.departureTime).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Arrival:</span>{' '}
                  {new Date(flight.flightDetails.arrivalTime).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Amount:</span> RS. {flight.amount}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Transaction ID:</span>{' '}
                  {flight.transactionId}
                </p>
              </div>

              {/* View/Download Invoice Button */}
              {flight.invoiceUrl && (
                <div className="mt-4">
                  <a
                    href={flight.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    View/Download Invoice
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}