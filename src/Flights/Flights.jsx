import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const RAPIDAPI_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9";
const API_HOST = "booking-com15.p.rapidapi.com";

export default function Flights() {
  const location = useLocation();
  const { fromId, toId, departureDate, returnDate, cabinClass } = location.state || {};
  console.log("Flights search params:", { fromId, toId, departureDate, returnDate, cabinClass });

  const [flightDeals, setFlightDeals] = useState([]);
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
      if (cabinClass != "Do not include in request") url += `&cabinClass=${cabinClass}`;
      console.log(url)

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Available Flight Deals</h1>
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {flightDeals.length > 0 && (
        <div className="w-full max-w-4xl space-y-4">
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
        </div>
      )}
    </div>
  );
}
