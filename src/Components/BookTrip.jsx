import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import TripInvoicePDF from './TripInvoicePDF';

export default function BookTrip({ tripData, onSuccess, buttonLabel = "Book This Trip", buttonClassName = "" }) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const storage = getStorage();
  // Calculate total amount from flight + hotel based on the actual structure we receive from TripDetails.jsx
  const hotelTotalPrice = tripData.hotel?.totalPrice || 
                        (tripData.hotel?.pricePerDay && tripData.hotel?.daysOfStay ? 
                         tripData.hotel.pricePerDay * tripData.hotel.daysOfStay : 0);
  const totalAmount = (tripData.flight?.amount || 0) + hotelTotalPrice;

  // Log the tripData to debug pricing issues
  useEffect(() => {
    console.log("BookTrip received tripData:", JSON.stringify(tripData, null, 2));
    console.log("Calculated total amount:", totalAmount);
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

  const handleBookClick = () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      navigate('/login', { state: { returnUrl: window.location.pathname } });
      return;
    }
    
    setShowPaymentModal(true);
  };

  const generatePDFBlob = async (tripDetails, transactionId) => {
    if (!tripDetails || !userData) {
      throw new Error("Trip details or user data is missing");
    }

    const pdfElement = (
      <TripInvoicePDF
        tripDetails={tripDetails}
        transactionId={transactionId}
        paymentMethod={paymentMethod}
        userData={userData}
        totalAmount={totalAmount}
      />
    );

    const blob = await pdf(pdfElement).toBlob();
    return blob;
  };
  const saveTripToFirebase = async (transactionId, invoiceUrl) => {
    try {
      // Detailed logging of all trip data before saving
      console.log("==== TRIP DATA BEING SAVED TO FIREBASE ====");
      console.log("Trip data object:", tripData);
      console.log("Flight data:", {
        amount: tripData.flight?.amount,
        token: tripData.flight?.token,
        departure: tripData.flight?.departure,
        arrival: tripData.flight?.arrival
      });
      console.log("Hotel data:", {
        id: tripData.hotel?.id,
        name: tripData.hotel?.name,
        pricePerDay: tripData.hotel?.pricePerDay,
        totalPrice: tripData.hotel?.totalPrice,
        calculatedTotal: (tripData.hotel?.pricePerDay || 0) * (tripData.hotel?.daysOfStay || 1),
        daysOfStay: tripData.hotel?.daysOfStay
      });
      
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No user logged in");
      }

      // Save flight booking
      const flightBooking = {
        userId: user.uid,
        token: tripData.flight?.token || '',
        transactionId: transactionId,
        flightNumber: tripData.flight?.flightNumber || 'N/A',
        amount: tripData.flight?.amount || 0,
        bookingDate: new Date().toISOString(),
        paymentMethod: paymentMethod,
        flightDetails: {
          departure: tripData.flight?.departure || 'N/A',
          arrival: tripData.flight?.arrival || 'N/A',
          departureTime: tripData.flight?.departureTime || 'N/A',
          arrivalTime: tripData.flight?.arrivalTime || 'N/A'
        },
        status: 'confirmed',
        invoiceUrl: invoiceUrl,
      };

      await addDoc(collection(db, 'user_flights'), flightBooking);      // Calculate hotel total amount correctly, ensuring it's not zero
      const hotelPricePerNight = tripData.hotel?.pricePerDay || 0;
      const hotelDaysOfStay = tripData.hotel?.daysOfStay || 1;
      const calculatedHotelTotal = hotelPricePerNight * hotelDaysOfStay;
      
      // For debugging - explicitly log the price calculation
      console.log("Hotel price calculation:", {
        pricePerNight: hotelPricePerNight,
        daysOfStay: hotelDaysOfStay,
        calculatedTotal: calculatedHotelTotal,
        providedTotalPrice: tripData.hotel?.totalPrice,
        isCalculatedTotalSame: calculatedHotelTotal === tripData.hotel?.totalPrice
      });
      
      // Save hotel booking
      const hotelBooking = {
        userId: user.uid,
        hotelId: tripData.hotel?.id || '',
        transactionId: transactionId,
        hotelName: tripData.hotel?.name || 'N/A',
        amount: tripData.hotel?.totalPrice || calculatedHotelTotal || 0,  // Use totalPrice or calculated total
        pricePerNight: hotelPricePerNight,
        daysOfStay: hotelDaysOfStay,
        bookingDate: new Date().toISOString(),
        paymentMethod: paymentMethod,
        checkIn: tripData.flight?.departureTime || 'N/A', // Using flight dates as default
        checkOut: tripData.flight?.arrivalTime || 'N/A',
        location: tripData.hotel?.location || 'N/A',
        status: 'confirmed',
        invoiceUrl: invoiceUrl,
      };
      
      // Log the exact data that's being saved
      console.log("Saving hotel booking with data:", JSON.stringify(hotelBooking, null, 2));
      console.log("Original hotel data in tripData:", {
        totalPrice: tripData.hotel?.totalPrice,
        pricePerDay: tripData.hotel?.pricePerDay,
        price: tripData.hotel?.price, // This property doesn't exist in the passed data
        daysOfStay: tripData.hotel?.daysOfStay,
        calculatedTotal: (tripData.hotel?.pricePerDay || 0) * (tripData.hotel?.daysOfStay || 1)
      });
      
      await addDoc(collection(db, 'user_hotels'), hotelBooking);
        // Calculate the proper total amount directly from the flight and hotel data
      const flightAmount = tripData.flight?.amount || 0;
      const hotelAmount = tripData.hotel?.totalPrice || 
                        (tripData.hotel?.pricePerDay ? (tripData.hotel.pricePerDay * tripData.hotel.daysOfStay) : 0);
      const calculatedTotalAmount = flightAmount + hotelAmount;
      
      console.log("Trip booking calculation:", {
        flightAmount, 
        hotelAmount,
        calculatedTotalAmount,
        originalTotalAmount: totalAmount
      });
      
      // Save combined trip booking
      const tripBooking = {
        userId: user.uid,
        transactionId: transactionId,
        flightId: tripData.flight?.token || '',
        hotelId: tripData.hotel?.id || '',
        totalAmount: calculatedTotalAmount, // Use the correctly calculated amount
        flightAmount: flightAmount,
        hotelAmount: hotelAmount,
        daysOfStay: tripData.hotel?.daysOfStay || 1,
        bookingDate: new Date().toISOString(),
        paymentMethod: paymentMethod,
        status: 'confirmed',
        invoiceUrl: invoiceUrl,
      };
      
      await addDoc(collection(db, 'user_trip_bookings'), tripBooking);

      return true;
    } catch (error) {
      console.error("Error saving trip booking: ", error);
      throw error;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Log full trip data again right before processing
      console.log("Processing booking with trip data:", {
        flight: tripData.flight,
        hotel: {
          ...tripData.hotel,
          totalPrice: tripData.hotel?.totalPrice || 0,
          pricePerDay: tripData.hotel?.pricePerDay || 0,
          daysOfStay: tripData.hotel?.daysOfStay || 1,
          calculatedTotal: (tripData.hotel?.pricePerDay || 0) * (tripData.hotel?.daysOfStay || 1)
        }
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransactionId = `TRIP-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate and upload PDF
      const pdfBlob = await generatePDFBlob(tripData, newTransactionId);
      const storageRef = ref(storage, `trip_invoices/${newTransactionId}.pdf`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);
      
      // Save trip data to Firebase
      await saveTripToFirebase(newTransactionId, pdfUrl);
      
      toast.success("Trip booked successfully!");
      setShowPaymentModal(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error processing payment: ", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleBookClick}
        className={buttonClassName || "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium w-full"}
        disabled={processing}
      >
        {buttonLabel}
      </button>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5">
              <h2 className="text-xl font-bold text-white">Complete Your Booking</h2>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-3 right-3 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Trip Summary</h3>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Flight:</span> {tripData.flight?.departure} → {tripData.flight?.arrival}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Flight Number:</span> {tripData.flight?.flightNumber || 'N/A'}
                  </p>                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Flight Price:</span> RS. {Math.floor(tripData.flight?.amount * 280 || 0)} PKR
                  </p>
                  <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <span className="font-medium">Hotel:</span> {tripData.hotel?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {tripData.hotel?.location || 'N/A'}
                  </p>                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Price per night:</span> RS. {Math.floor((tripData.hotel?.pricePerDay || 0) * 280)} PKR
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Stay duration:</span> {tripData.hotel?.daysOfStay || 1} night(s)
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Hotel Total:</span> RS. {Math.floor((tripData.hotel?.totalPrice || 0) * 280)} PKR
                  </p>
                </div>
                
                <p className="text-lg font-bold text-gray-800">Total Amount: RS. {Math.floor(totalAmount * 280)} PKR</p>
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
                  {processing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
