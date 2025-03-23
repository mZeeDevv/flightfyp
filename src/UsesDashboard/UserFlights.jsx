import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FaPlaneDeparture, FaPlaneArrival, FaMoneyBillWave, FaFileInvoice } from 'react-icons/fa';

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
      completed: "bg-gray-200 text-gray-800",
      upcoming: "bg-green-100 text-green-800",
      imminent: "bg-yellow-100 text-yellow-800"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">My Flight Bookings</h1>
        <p className="text-gray-600 mb-6">View and manage your flight reservations</p>
        
        {flights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4">
              <FaPlaneDeparture className="mx-auto text-4xl text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">No flight bookings found.</p>
            <p className="text-gray-500 mt-2">Your booked flights will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flights.map((flight) => (
              <div key={flight.id} className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {flight.flightDetails.departure} → {flight.flightDetails.arrival}
                    </h2>
                    {getStatusTag(flight.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Flight {flight.flightDetails.flightNumber || 'N/A'}
                  </p>
                </div>
                
                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FaPlaneDeparture className="text-blue-500 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Departure</p>
                        <p className="text-gray-800">
                          {new Date(flight.flightDetails.departureTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaPlaneArrival className="text-blue-500 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Arrival</p>
                        <p className="text-gray-800">
                          {new Date(flight.flightDetails.arrivalTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaMoneyBillWave className="text-blue-500 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-gray-800">RS. {flight.amount}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaFileInvoice className="text-blue-500 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="text-gray-800 font-mono text-sm">{flight.transactionId}</p>
                      </div>
                    </div>
                  </div>

                  {flight.invoiceUrl && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <a
                        href={flight.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        <FaFileInvoice className="mr-2" />
                        View Invoice
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}