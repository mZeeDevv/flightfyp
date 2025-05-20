import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
// Remove Firebase storage imports
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
  // Remove Firebase storage instance
  
  const hotelPricePerDay = parseFloat(tripData.hotel?.pricePerDay || 0);
  const hotelDaysOfStay = parseInt(tripData.hotel?.daysOfStay || 1);
  const hotelTotalPrice = tripData.hotel?.totalPrice || (hotelPricePerDay * hotelDaysOfStay);
  const flightAmount = parseFloat(tripData.flight?.amount || 0);
  const totalAmount = flightAmount + hotelTotalPrice;
  
  console.log("Price calculation in BookTrip:", {
    hotelPricePerDay,
    hotelDaysOfStay,
    hotelTotalPrice,
    flightAmount,
    totalAmount
  });

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
    
    // Ensure hotel prices are correctly calculated for the PDF
    const pdfTripDetails = {
      ...tripDetails,
      hotel: {
        ...tripDetails.hotel,
        pricePerDay: parseFloat(tripDetails.hotel?.pricePerDay || 0),
        totalPrice: parseFloat(tripDetails.hotel?.totalPrice || 0) || 
                  (parseFloat(tripDetails.hotel?.pricePerDay || 0) * parseInt(tripDetails.hotel?.daysOfStay || 1))
      },
      flight: {
        ...tripDetails.flight,
        // Ensure tripType is properly set
        tripType: tripDetails.flight.tripType || (tripDetails.flight.isRoundTrip ? "ROUNDTRIP" : "ONE_WAY")
      }
    };
    
    console.log("PDF generation with trip details:", {
      original: tripDetails,
      modified: pdfTripDetails,
      hotelPricePerDay: pdfTripDetails.hotel?.pricePerDay,
      hotelTotalPrice: pdfTripDetails.hotel?.totalPrice,
      tripType: pdfTripDetails.flight.tripType,
      isRoundTrip: pdfTripDetails.flight.isRoundTrip
    });
    
    // Create a basic searchResults object with necessary info
    // This provides fallback data that TripInvoicePDF might need
    const searchResults = {
      from: tripDetails.flight?.departure,
      to: tripDetails.flight?.arrival,
      departureDate: tripDetails.flight?.departureTime?.split('T')[0],
      // Only include returnDate if it's explicitly a round trip
      returnDate: tripDetails.flight?.tripType === "ROUNDTRIP" || tripDetails.flight?.isRoundTrip ? 
              (tripDetails.flight?.returnDepartureTime?.split('T')[0] || 
              tripDetails.flight?.arrivalTime?.split('T')[0]) : 
              null,
      // Explicitly pass the trip type
      tripType: tripDetails.flight?.tripType || (tripDetails.flight?.isRoundTrip ? "RETURN" : "ONE_WAY"),
      cabinClass: tripDetails.flight?.cabinClass || "ECONOMY",
      daysOfStay: tripDetails.hotel?.daysOfStay || 1,
    };
    
    console.log("Providing searchResults to PDF:", searchResults);
    
    const pdfElement = (
      <TripInvoicePDF
        tripDetails={pdfTripDetails}
        transactionId={transactionId}
        paymentMethod={paymentMethod}
        userData={userData}
        totalAmount={flightAmount + pdfTripDetails.hotel.totalPrice}
        searchResults={searchResults}  // Include searchResults
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
      // Log full trip data for debugging
      console.log("Processing booking with trip data:", tripData);
      
      // Explicitly check for one-way trip type
      const tripType = tripData.flight?.tripType || searchResults?.tripType;
      const isOneWay = tripType === "ONE_WAY" || tripType === "ONEWAY";
      const isRoundTrip = !isOneWay && (
        tripType === "ROUNDTRIP" || 
        tripType === "RETURN" || 
        tripData.flight?.isRoundTrip || 
        Boolean(tripData.flight?.returnDepartureTime && tripData.flight?.returnArrivalTime)
      );
      
      console.log("Flight trip type:", tripType, "isOneWay:", isOneWay, "isRoundTrip:", isRoundTrip);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransactionId = `TRIP-${Math.random().toString(36).substr(2, 9)}`;
      
      // Make sure tripData includes correct tripType flag
      const enhancedTripData = {
        ...tripData,
        flight: {
          ...tripData.flight,
          isRoundTrip: isRoundTrip,
          tripType: isOneWay ? "ONE_WAY" : (tripType || (isRoundTrip ? "ROUNDTRIP" : "ONE_WAY"))
        }
      };
      
      console.log("Enhanced trip data for PDF:", {
        isRoundTrip: enhancedTripData.flight.isRoundTrip, 
        tripType: enhancedTripData.flight.tripType
      });
      
      // Generate PDF with enhanced trip data
      const pdfBlob = await generatePDFBlob(enhancedTripData, newTransactionId);
      
      // Upload PDF to Cloudinary instead of Firebase Storage
      const pdfUrl = await uploadPdfToCloudinary(pdfBlob, newTransactionId);
      
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
      // Provide more detailed error information for debugging
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Add Cloudinary upload function for PDFs
  const uploadPdfToCloudinary = async (pdfBlob, transactionId) => {
    const cloudName = import.meta.env.VITE_CLOUDNAME;
    const apiKey = import.meta.env.VITE_API_KEY_C;
    const apiSecret = import.meta.env.VITE_API_KEY_SECRET_C;
    
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const formData = new FormData();
      
      // Convert the blob to a file with a specific name
      const file = new File([pdfBlob], `trip_invoice_${transactionId}.pdf`, { type: 'application/pdf' });
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("folder", `trip_invoices`);
      
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
        folder: 'trip_invoices',
      });
      
      formData.append("signature", signature);
      
      console.log("Uploading Trip PDF to Cloudinary...");
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("Cloudinary error details:", data);
        throw new Error(`Cloudinary upload failed: ${data.error.message}`);
      }
      
      console.log("Trip PDF uploaded successfully to Cloudinary:", data);
      console.log("PDF URL:", data.secure_url);
      
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading PDF to Cloudinary:", error);
      throw error;
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
                    <span className="font-medium">Flight Price:</span> RS. {Math.floor((tripData.flight?.amount || 0) * 280)} PKR
                  </p>
                  <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <span className="font-medium">Hotel:</span> {tripData.hotel?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {tripData.hotel?.location || 'N/A'}
                  </p>                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Price per night:</span> RS. {Math.floor((hotelPricePerDay || 0) * 280)} PKR
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Stay duration:</span> {hotelDaysOfStay || 1} night(s)
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Hotel Total:</span> RS. {Math.floor((hotelTotalPrice || 0) * 280)} PKR
                  </p>
                </div>
                
                <p className="text-lg font-bold text-gray-800">Total Amount: RS. {Math.floor((flightAmount + hotelTotalPrice) * 280)} PKR</p>
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
