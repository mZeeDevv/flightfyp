import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import FlightInvoicePDF from '../Components/FlightInvoice';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, flightNumber, token, apiKey } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [flightDetails, setFlightDetails] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const storage = getStorage();

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      fetchUserData(auth.currentUser.uid);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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

    // Check if API key is available
    if (!apiKey) {
      console.error("No API key available");
      return null;
    }

    const url = `https://booking-com15.p.rapidapi.com/api/v1/flights/getFlightDetails?token=${token}&currency_code=INR`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      console.log("Flight details API response:", result);
      if (result.status === true && result.data) {
        return result.data;
      } else {
        console.error("API returned no data:", result);
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
        status: 'confirmed',
        invoiceUrl: flightData.invoiceUrl || '',
      };

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      const details = await fetchFlightDetails();
      if (!details) {
        throw new Error("Failed to fetch flight details");
      }

      const newTransactionId = Math.random().toString(36).substr(2, 9);
      const pdfBlob = await generatePDFBlob(details, newTransactionId);
      const storageRef = ref(storage, `invoices/${newTransactionId}.pdf`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);

      await saveFlightToFirebase({
        ...details,
        transactionId: newTransactionId,
        invoiceUrl: pdfUrl,
      });

      setFlightDetails(details);
      setTransactionId(newTransactionId);
      setPaymentSuccess(true);
      navigate('/my-flights');
    } catch (error) {
      console.error("Error processing payment: ", error);
    } finally {
      setProcessing(false);
    }
  };

  const generatePDFBlob = async (flightDetails, transactionId) => {
    if (!flightDetails || !userData) {
      throw new Error("Flight details or user data is missing");
    }

    const pdfElement = (
      <FlightInvoicePDF
        flightDetails={flightDetails}
        transactionId={transactionId}
        paymentMethod={paymentMethod}
        userData={userData}
        amount={amount}
      />
    );

    const blob = await pdf(pdfElement).toBlob();
    return blob;
  };

  if (paymentSuccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h1 className="text-2xl font-bold text-white">Payment Details</h1>
          <p className="text-sm text-blue-100">Complete your booking by entering your payment details.</p>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-lg font-semibold text-gray-800">Amount: RS. {amount}</p>
            <p className="text-sm text-gray-500">Flight: {flightNumber}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                maxLength="16"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <input
                  type="password"
                  maxLength="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}