import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FlightInvoicePDF } from '../Components/FlightInvoice';
import { db } from '../firebase'; // Make sure this path is correct
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, flightNumber, token } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [flightDetails, setFlightDetails] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="mb-6">Please login to continue with your payment.</p>
          <button
            onClick={() => navigate('/login', { state: { returnUrl: location.pathname } })}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const fetchFlightDetails = async () => {
    if (!token) {
      console.error("No token available");
      return null;
    }

    const url = `https://booking-com15.p.rapidapi.com/api/v1/flights/getFlightDetails?token=${token}&currency_code=INR`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": "c78b8b63cemshd029e4bc8339cc2p13203djsncc173c1c68c4",
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (result.status === true && result.data) {
        return result.data;
      }
    } catch (error) {
      console.error("Error fetching flight details:", error);
    }
    return null;
  };

  const saveFlightToFirebase = async (flightData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No user logged in");
      }

      // Validate and clean data before saving
      const flightBooking = {
        userId: user.uid,
        token: token || '',
        transactionId: flightData.transactionId || '',
        flightNumber: flightData.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
        amount: amount || 0,
        bookingDate: new Date().toISOString(),
        paymentMethod: paymentMethod || 'credit',
        flightDetails: {
          departure: flightData.segments?.[0]?.departureAirport?.name || 'N/A',
          arrival: flightData.segments?.[0]?.arrivalAirport?.name || 'N/A',
          departureTime: flightData.segments?.[0]?.departureTime || 'N/A',
          arrivalTime: flightData.segments?.[0]?.arrivalTime || 'N/A'
        },
        status: 'confirmed'
      };

      // Validate that required fields are present
      if (!flightBooking.token || !flightBooking.transactionId) {
        throw new Error("Missing required booking information");
      }

      const docRef = await addDoc(collection(db, 'user_flights'), flightBooking);
      console.log("Flight booking saved with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving flight booking: ", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    const auth = getAuth();
    if (!auth.currentUser) {
      navigate('/login', { state: { returnUrl: location.pathname } });
      return;
    }

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch flight details for the invoice
      const details = await fetchFlightDetails();
      const newTransactionId = Math.random().toString(36).substr(2, 9);
      
      // Save to Firebase
      await saveFlightToFirebase({
        ...details,
        transactionId: newTransactionId
      });

      setFlightDetails(details);
      setTransactionId(newTransactionId);
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Error processing payment: ", error);
      // Handle error - you might want to show an error message to the user
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess && flightDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="mb-4">Transaction ID: {transactionId}</p>
          <PDFDownloadLink
            document={
              <FlightInvoicePDF
                flightDetails={flightDetails}
                transactionId={transactionId}
                paymentMethod={paymentMethod}
              />
            }
            fileName={`flight-invoice-${transactionId}.pdf`}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
          >
            {({ blob, url, loading, error }) =>
              loading ? 'Generating PDF...' : 'Download Invoice'
            }
          </PDFDownloadLink>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 block w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Payment Details</h1>
        <div className="mb-4">
          <p className="text-lg font-semibold">Amount: ₹{amount}</p>
          <p className="text-gray-600">Flight: {flightNumber}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Payment Method</label>
            <select
              className="w-full p-2 border rounded"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Card Number</label>
            <input
              type="text"
              maxLength="16"
              className="w-full p-2 border rounded"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Expiry Date</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="MM/YY"
                maxLength="5"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-2">CVV</label>
              <input
                type="password"
                maxLength="3"
                className="w-full p-2 border rounded"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
