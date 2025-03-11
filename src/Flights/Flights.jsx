import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component

const RAPIDAPI_KEY = "c78b8b63cemshd029e4bc8339cc2p13203djsncc173c1c68c4";
const API_HOST = "booking-com15.p.rapidapi.com";

export default function Flights() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fromId, toId, departureDate, returnDate, cabinClass } = location.state || {};
  const [flightDeals, setFlightDeals] = useState([]);
  const [flightoffers, setFlightOffers] = useState([]);
  const [airlines, setAirlines] = useState([]); // State for airlines
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      if (!fromId || !toId || !departureDate) {
        setError("Missing required search parameters.");
        return;
      }

      let url = `https://${API_HOST}/api/v1/flights/searchFlights?fromId=${fromId}&toId=${toId}&departDate=${departureDate}&currency_code=INR`;
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
          setAirlines(result.data.aggregation?.airlines || []); // Set airlines data
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

  // Show Spinner while loading or uploading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Function to handle "More Information" button click
  const handleMoreInfo = (token) => {
    navigate("/flight-details", { state: { token } });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Available Flight Deals</h1>
      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Flight Deals Section */}
      {flightDeals.length > 0 && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Top Flight Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flightDeals.map((deal, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{deal.key}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      RS {`${deal.price?.units || 0}.${String(0).padStart(2, "0")}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Airlines Section */}
      {airlines.length > 0 && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Airlines Providing Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {airlines.map((airline, index) => (
              <div key={index} className="flex items-center space-x-2">
                <img
                  src={airline.logoUrl}
                  alt={airline.name}
                  className="w-10 h-10 rounded-full"
                />
                <p className="text-gray-700 font-medium">{airline.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flight Offers Section */}
      {flightoffers.length > 0 && (
        <div className="w-full p-6">
          <h2 className="text-2xl font-semibold mb-4">Flight Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {flightoffers.map((deal, index) => {
              const departureAirport = deal.segments?.[0]?.departureAirport;
              const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
              const departureTime = deal.segments?.[0]?.departureTime || "N/A";
              const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
              const tripType = deal.tripType || "N/A";
              const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";

              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  {/* Flight Route */}
                  <div className="border-b pb-3 mb-3">
                    <div className="grid grid-cols-3">
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
                  <div className="bg-gray-100 p-3 rounded-md mb-4">
                    <p className="text-gray-700 font-semibold">Total Price:</p>
                    <p className="text-xl font-bold text-blue-600">RS. {price}</p>
                  </div>
                  <button
                    onClick={() => handleMoreInfo(deal.token)}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    More Information
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}