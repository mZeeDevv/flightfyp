import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component

export default function FlightDetails() {
  const location = useLocation();
  const { token } = location.state || {};
  const [flightDetails, setFlightDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  

  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (!token) {
        setError("No token provided.");
        setLoading(false);
        return;
      }

      const url = `https://booking-com15.p.rapidapi.com/api/v1/flights/getFlightDetails?token=${token}&currency_code=INR`;
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9",
          "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        },
      };

      try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log("Flight Details API Response:", result);

        if (result.status === true && result.data) {
          setFlightDetails(result.data);
        } else {
          setError("No flight details found.");
        }
      } catch (error) {
        console.error("Error fetching flight details:", error);
        setError("Failed to fetch flight details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDetails();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-6">Flight Details</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Flight Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        {flightDetails ? (
          <div className="space-y-4">
            {/* Flight Route */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Flight Route</h2>
              <p className="text-gray-600">
                {flightDetails.segments?.[0]?.departureAirport?.name} → {flightDetails.segments?.[0]?.arrivalAirport?.name}
              </p>
            </div>

            {/* Flight Timing */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Timing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Departure Time</p>
                  <p className="text-gray-600">{flightDetails.segments?.[0]?.departureTime || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Arrival Time</p>
                  <p className="text-gray-600">{flightDetails.segments?.[0]?.arrivalTime || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Price</h2>
              <p className="text-gray-600">
                ${flightDetails.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A"}
              </p>
            </div>

            {/* Additional Details */}
            <div>
              <h2 className="text-xl font-semibold">Additional Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Cabin Class</p>
                  <p className="text-gray-600">{flightDetails.segments?.[0]?.cabinClass || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Trip Type</p>
                  <p className="text-gray-600">{flightDetails.tripType || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No flight details available.</p>
        )}
      </div>
    </div>
  );
}