import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component

export default function FlightDetails() {
  const location = useLocation();
  const navigate = useNavigate();
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
          "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
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

  const handlePaymentClick = () => {
    navigate('/payment', { 
      state: { 
        amount: flightDetails.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units,
        flightNumber: flightDetails.segments?.[0]?.legs?.[0]?.flightNumber,
        token: token // Add the token to the state
      } 
    });
  };

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
                RS. {flightDetails.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A"}
              </p>
            </div>
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Luggage Information</h2>
              {flightDetails.segments?.map((segment, segmentIndex) => (
                <div key={segmentIndex} className="mb-4">
                  <p className="font-medium">Segment {segmentIndex + 1}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Cabin Luggage */}
                    <div>
                      <p className="font-medium">Cabin Luggage</p>
                      <p className="text-gray-600">
                        {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.maxPiece} piece(s),{" "}
                        {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.maxWeightPerPiece}{" "}
                        {segment.travellerCabinLuggage?.[0]?.luggageAllowance?.massUnit}
                      </p>
                    </div>
                    {/* Checked Luggage */}
                    <div>
                      <p className="font-medium">Checked Luggage</p>
                      <p className="text-gray-600">
                        {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxPiece} piece(s),{" "}
                        {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.maxTotalWeight}{" "}
                        {segment.travellerCheckedLuggage?.[0]?.luggageAllowance?.massUnit}
                      </p>
                    </div>
                  </div>
                  {/* Add a horizontal line after each segment except the last one */}
                  {segmentIndex !== flightDetails.segments.length - 1 && (
                    <hr className="my-4 border-t border-gray-300" />
                  )}
                </div>
              ))}
            </div>
            {/* Flight Stops */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Flight Stops</h2>
              {flightDetails.segments?.[0]?.legs?.map((leg, index) => {
                // Remove duplicate airlines
                const uniqueCarriers = leg.carriersData?.filter(
                  (carrier, carrierIndex, self) =>
                    self.findIndex((c) => c.name === carrier.name) === carrierIndex
                );

                return (
                  <div key={index} className={`mb-4 ${index !== flightDetails.segments[0].legs.length - 1 ? 'border-b pb-4' : ''}`}>
                    <p className="font-medium">Leg {index + 1}</p>
                    <p className="text-gray-600">
                      {leg.departureAirport?.name} → {leg.arrivalAirport?.name}
                    </p>
                    <p className="text-gray-600">Departure: {leg.departureTime}</p>
                    <p className="text-gray-600">Arrival: {leg.arrivalTime}</p>
                    {/* Airline Logos and Names */}
                    <div className="mt-2">
                      <h3 className="text-lg font-semibold">Airline:</h3>
                      <div className="flex flex-wrap gap-4">
                        {uniqueCarriers?.map((carrier, carrierIndex) => (
                          <div key={carrierIndex} className="flex items-center space-x-2">
                            <img
                              src={carrier.logo}
                              alt={`${carrier.name} logo`}
                              className="w-10 h-10 rounded-full"
                            />
                            <p className="text-gray-600">{carrier.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
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

            {/* Supplier Information */}
            <div>
              <h2 className="text-xl font-semibold">Supplier Information</h2>
              {flightDetails.ancillaries?.flexibleTicket?.supplierInfo ? (
                <div>
                  <p>{flightDetails.ancillaries.flexibleTicket.supplierInfo.name || "N/A"}</p>
                  <p>
                    <a
                      href={flightDetails.ancillaries.flexibleTicket.supplierInfo.privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Terms and Policy
                    </a>
                  </p>
                </div>
              ) : (
                <p>No supplier information available.</p>
              )}
            </div>

            {/* Travel Insurance Benefits */}
            <div>
              <h2 className="text-xl font-semibold">Travel Insurance Benefits</h2>
              {flightDetails.ancillaries?.travelInsurance?.content?.benefits ? (
                <ul className="list-disc list-inside text-gray-600">
                  {flightDetails.ancillaries.travelInsurance.content.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              ) : (
                <p>No travel insurance benefits available.</p>
              )}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handlePaymentClick}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No flight details available.</p>
        )}
      </div>
    </div>
  );
}