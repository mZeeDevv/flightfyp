import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer'; // Remove PDFViewer import
import FlightInvoicePDF from '../Components/FlightInvoice';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logUserActivity } from "../services/LoggingService";

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
  // Remove PDF preview states

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
      console.log("Flight details API full response:", JSON.stringify(result, null, 2));
      
      if (result.status === true && result.data) {
       // Log the path to airline information
        console.log("API success, checking airline information...");
        
        if (result.data.segments && result.data.segments.length > 0) {
          const segment = result.data.segments[0];
          console.log("First segment:", segment);
          
          if (segment.legs && segment.legs.length > 0) {
            const leg = segment.legs[0];
            console.log("First leg:", leg);
            console.log("Airline info in first leg:", {
              airlineName: leg.airlineName,
              airline: leg.airline,
              airlineCode: leg.airlineCode,
              marketingCarrier: leg.marketingCarrier
            });
          }
        }
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

      // Debug logging - log the entire flight data structure
      console.log("Full flight data structure:", JSON.stringify(flightData, null, 2));
      
      // Log segments
      if (flightData.segments && flightData.segments.length > 0) {
        console.log("First segment:", JSON.stringify(flightData.segments[0], null, 2));
        
        // Log legs
        if (flightData.segments[0].legs && flightData.segments[0].legs.length > 0) {
          const leg = flightData.segments[0].legs[0];
          console.log("First leg:", JSON.stringify(leg, null, 2));
          
          // Log carriers data if available
          if (leg.carriersData && leg.carriersData.length > 0) {
            console.log("Carriers data:", JSON.stringify(leg.carriersData, null, 2));
          }
          
          // Specifically log all possible airline information paths
          console.log("Available airline data sources:", {
            "leg.airlineName": leg.airlineName,
            "leg.airline": leg.airline,
            "leg.airlineCode": leg.airlineCode,
            "leg.carriersData": leg.carriersData,
            "leg.carriers": leg.carriers,
            "leg.flightInfo?.carrierInfo": leg.flightInfo?.carrierInfo
          });
        }
      }

      // Extract airline information from carriersData which contains the correct information
      const leg = flightData.segments?.[0]?.legs?.[0];
      
      // First try to get data from carriersData array
      let airlineName = 'Unknown Airline';
      let airlineCode = 'N/A';
      let airlineLogo = '';
      
      // Check if carriersData exists and has elements
      if (leg?.carriersData && leg.carriersData.length > 0) {
        // Use first carrier in the array (usually the operating carrier)
        const carrier = leg.carriersData[0];
        airlineName = carrier.name || 'Unknown Airline';
        airlineCode = carrier.code || 'N/A';
        airlineLogo = carrier.logo || '';
        console.log("Found airline info in carriersData:", carrier);
      } 
      // If carriersData doesn't have what we need, fall back to other possible locations
      else {
        airlineName = leg?.airlineName || 
                    leg?.airline?.name ||
                    leg?.marketingCarrier?.name ||
                    flightData.segments?.[0]?.airline?.name ||
                    'Unknown Airline';
        
        airlineCode = leg?.airlineCode || 
                    leg?.airline?.code ||
                    leg?.marketingCarrier?.code ||
                    flightData.segments?.[0]?.airline?.code ||
                    'N/A';
                        
        airlineLogo = leg?.airline?.logoUrl || 
                    leg?.marketingCarrier?.logoUrl ||
                    flightData.segments?.[0]?.airline?.logoUrl ||
                    '';
      }

      // Log the extracted information
      console.log("Extracted airline information:", {
        name: airlineName,
        code: airlineCode,
        logo: airlineLogo
      });

      const flightBooking = {
        userId: user.uid,
        token: token || '',
        transactionId: flightData.transactionId || '',
        flightNumber: flightData.segments?.[0]?.legs?.[0]?.flightNumber || 
                      flightData.segments?.[0]?.legs?.[0]?.flightInfo?.flightNumber || 
                      'N/A',
        amount: amount || 0,
        bookingDate: new Date().toISOString(),
        paymentMethod: paymentMethod || 'credit',
        flightDetails: {
          departure: flightData.segments?.[0]?.departureAirport?.name || 'N/A',
          arrival: flightData.segments?.[0]?.arrivalAirport?.name || 'N/A',
          departureTime: flightData.segments?.[0]?.departureTime || 'N/A',
          arrivalTime: flightData.segments?.[0]?.arrivalTime || 'N/A',
          airline: airlineName,
          airlineCode: airlineCode,
          airlineLogo: airlineLogo,
          aircraft: flightData.segments?.[0]?.legs?.[0]?.aircraft || 
                    flightData.segments?.[0]?.legs?.[0]?.planeType || 
                    'N/A'
        },
        status: 'confirmed',
        invoiceUrl: flightData.invoiceUrl || '',
        // Store airline data at top level for easier queries
        airline: airlineName,
        airlineCode: airlineCode,
        airlineLogo: airlineLogo
      };

      // Log the final flight booking object being saved
      console.log("Final flight booking object:", flightBooking);

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
      console.log("Starting payment process...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Fetching flight details with token:", token);
      const details = await fetchFlightDetails();
      if (!details) {
        throw new Error("Failed to fetch flight details");
      }
      console.log("Successfully fetched flight details:", details);

      const newTransactionId = Math.random().toString(36).substr(2, 9);
      console.log("Generated transaction ID:", newTransactionId);
      
      // Generate PDF blob
      const pdfBlob = await generatePDFBlob(details, newTransactionId);
      
      // Upload PDF to Cloudinary
      const pdfUrl = await uploadPdfToCloudinary(pdfBlob, newTransactionId);
      
      // Log activity if not already logged in the Flights component
      const flightLogDetails = {
        from: details.segments?.[0]?.departureAirport?.name || 'N/A',
        to: details.segments?.[0]?.arrivalAirport?.name || 'N/A',
        departureTime: details.segments?.[0]?.departureTime || 'N/A',
        arrivalTime: details.segments?.[0]?.arrivalTime || 'N/A',
        flightNumber: details.segments?.[0]?.legs?.[0]?.flightNumber || 'N/A',
        transactionId: newTransactionId,
        price: amount || 'N/A',
        paymentStatus: 'completed'
      };
      
      await logUserActivity('completed payment for', 'flight', flightLogDetails);

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
  
  const uploadPdfToCloudinary = async (pdfBlob, transactionId) => {
    const cloudName = import.meta.env.VITE_CLOUDNAME;
    const apiKey = import.meta.env.VITE_API_KEY_C;
    const apiSecret = import.meta.env.VITE_API_KEY_SECRET_C;
    
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const formData = new FormData();
      
      // Convert the blob to a file with a specific name
      const file = new File([pdfBlob], `invoice_${transactionId}.pdf`, { type: 'application/pdf' });
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("folder", `flight_invoices`);
      
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
        folder: 'flight_invoices',
      });
      
      formData.append("signature", signature);
      
      console.log("Uploading PDF to Cloudinary...");
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("Cloudinary error details:", data);
        throw new Error(`Cloudinary upload failed: ${data.error.message}`);
      }
      
      console.log("PDF uploaded successfully to Cloudinary:", data);
      console.log("PDF URL:", data.secure_url);
      console.log("PDF location in Cloudinary:", `flight_invoices/invoice_${transactionId}.pdf`);
      
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading PDF to Cloudinary:", error);
      throw error;
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