import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component

const RAPIDAPI_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9";
const API_HOST = "booking-com15.p.rapidapi.com";

export default function Flights() {
  const location = useLocation();
  const { fromId, toId, departureDate, returnDate, cabinClass } = location.state || {};
  const [flightDeals, setFlightDeals] = useState([]);
  const [flightoffers, setFlightOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      if (!fromId || !toId || !departureDate) {
        setError("Missing required search parameters.");
        return;
      }

      let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}`;
      if (returnDate) url += `&returnDate=${returnDate}`;
      if (cabinClass !== "Do not include in request") url += `&cabinClass=${cabinClass}`;

      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": API_HOST,
        },
      };

      try {
        setLoading(true);
        setError("");
        const response = await fetch(url, options);
        const result = await response.json();
        console.log("API Response:", result);

        if (result.status === true && result.data?.flightDeals?.length > 0) {
          setFlightDeals(result.data.flightDeals);
          setFlightOffers(result.data.flightOffers);
        } else {
          setError("No flight deals found.");
          setFlightDeals([]);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
        setError("Failed to fetch flight data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [fromId, toId, departureDate, returnDate, cabinClass]);

  console.log(flightoffers);
  console.log(flightDeals);

   // Show Spinner while loading or uploading
   if (loading) {
    return (<div className="min-h-screen flex items-center justify-center">
       <Spinner />;
    </div>
    )
   }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Available Flight Deals</h1>
      {error && <div className="text-center text-red-500">{error}</div>}

      {flightDeals.length > 0 && (
        <div className="w-full max-w-4xl space-y-4">
          {/* DEALS */}
          {flightDeals.map((deal, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{deal.key}</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    ${deal.price?.units || 0}.{deal.price?.nanos ? (deal.price.nanos / 1e9).toFixed(2).slice(2) : "00"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* OFFERS */}
          {flightoffers.map((deal, index) => {
            const departureAirport = deal.segments?.[0]?.departureAirport;
            const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
            const departureTime = deal.segments?.[0]?.departureTime || "N/A";
            const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
            const tripType = deal.tripType || "N/A";
            const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";

            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mb-6">
                {/* Flight Route */}
                <div className="flex justify-between border-b pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Departure</h3>
                    <p className="text-gray-600">
                      {departureAirport?.name || "Unknown Airport"}, {departureAirport?.countryName || "Unknown Country"}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-blue-500 font-medium">{tripType}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Arrival</h3>
                    <p className="text-gray-600">
                      {arrivalAirport?.name || "Unknown Airport"}, {arrivalAirport?.countryName || "Unknown Country"}
                    </p>
                  </div>
                </div>

                {/* Flight Timing */}
                <div className="flex justify-between text-gray-600 mb-3">
                  <div>
                    <p className="font-medium">Departure Time</p>
                    <p className="text-sm">{departureTime}</p>
                  </div>
                  <div>
                    <p className="font-medium">Arrival Time</p>
                    <p className="text-sm">{arrivalTime}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                  <p className="text-gray-700 font-semibold">Total Price:</p>
                  <p className="text-xl font-bold text-blue-600">${price}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}