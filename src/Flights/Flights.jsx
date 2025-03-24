import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Spinner from '../Components/Spinner'; // Import the Spinner component

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
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
  
  // Add state for the sidebar
  const [showFlightDetailsSidebar, setShowFlightDetailsSidebar] = useState(false);
  const [flightDetailsToken, setFlightDetailsToken] = useState(null);
  const [flightDetailsData, setFlightDetailsData] = useState(null);
  const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);
  const [flightDetailsError, setFlightDetailsError] = useState("");

  // Function to handle viewing flight details in sidebar
  const handleViewFlightDetails = (token) => {
    setFlightDetailsToken(token);
    setShowFlightDetailsSidebar(true);
    fetchFlightDetails(token);
  };
  
  // Function to fetch flight details
  const fetchFlightDetails = async (token) => {
    if (!token) return;
    
    setLoadingFlightDetails(true);
    setFlightDetailsError("");
    setFlightDetailsData(null);
    
    const url = `https://${API_HOST}/api/v1/flights/getFlightDetails?token=${token}&currency_code=INR`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": API_HOST,
      },
    };
    
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      console.log("Flight Details API Response:", result);
      
      if (result.status === true && result.data) {
        setFlightDetailsData(result.data);
      } else {
        setFlightDetailsError("No flight details found.");
      }
    } catch (error) {
      console.error("Error fetching flight details:", error);
      setFlightDetailsError("Failed to fetch flight details. Please try again later.");
    } finally {
      setLoadingFlightDetails(false);
    }
  };
  
  // Function to close the sidebar
  const closeFlightDetailsSidebar = () => {
    setShowFlightDetailsSidebar(false);
  };

  // Function to handle proceed to payment
  const handlePaymentClick = () => {
    if (!flightDetailsData) return;
    
    navigate('/payment', { 
      state: { 
        amount: flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units,
        flightNumber: flightDetailsData.segments?.[0]?.legs?.[0]?.flightNumber,
        token: flightDetailsToken
      } 
    });
  };
  
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

  // Function to calculate flight duration
  const calculateDuration = (departureTime, arrivalTime) => {
    const depTime = new Date(departureTime).getTime();
    const arrTime = new Date(arrivalTime).getTime();
    return (arrTime - depTime) / (1000 * 60); // Duration in minutes
  };

  // Function to assign tags to flights
  const assignTags = (flights) => {
    if (flights.length === 0) return flights;
  
    // Helper function to normalize values between 0 and 1
    const normalize = (value, min, max) => (value - min) / (max - min);
  
    // Extract prices, durations, and number of legs
    const prices = flights.map(
      (flight) => flight.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || Infinity
    );
    const durations = flights.map((flight) =>
      calculateDuration(flight.segments?.[0]?.departureTime, flight.segments?.[0]?.arrivalTime)
    );
    const legs = flights.map((flight) => flight.segments?.[0]?.legs?.length || 1);
  
    // Find min and max for normalization
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
  
    // Assign tags
    return flights.map((flight, index) => {
      const tags = [];
      const price = prices[index];
      const duration = durations[index];
      const numLegs = legs[index];
  
      // Cheapest
      if (price === minPrice) {
        tags.push("Cheapest");
      }
  
      // Fastest
      if (duration === minDuration) {
        tags.push("Fastest");
      }
  
      // Best (based on a weighted score)
      const normalizedPrice = normalize(price, minPrice, maxPrice);
      const normalizedDuration = normalize(duration, minDuration, maxDuration);
      const score = 0.6 * normalizedPrice + 0.4 * normalizedDuration;
  
      // Assign "Best" tag to the flight with the lowest score
      if (score === Math.min(...flights.map((f, i) => 0.6 * normalize(prices[i], minPrice, maxPrice) + 0.4 * normalize(durations[i], minDuration, maxDuration)))) {
        tags.push("Best");
      }
      if (numLegs > 1) {
        tags.push("Multi-Stop");
      }
  
      return { ...flight, tags };
    });
  };
  const taggedFlightOffers = assignTags(flightoffers);
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
      {taggedFlightOffers.length > 0 && (
        <div className="w-full p-6">
          <h2 className="text-2xl font-semibold mb-4">Flight Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {taggedFlightOffers.map((deal, index) => {
              const departureAirport = deal.segments?.[0]?.departureAirport;
              const arrivalAirport = deal.segments?.[0]?.arrivalAirport;
              const departureTime = deal.segments?.[0]?.departureTime || "N/A";
              const arrivalTime = deal.segments?.[0]?.arrivalTime || "N/A";
              const tripType = deal.tripType || "N/A";
              const price = deal.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A";

              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  {/* Flight Tags */}
                  {deal.tags?.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      {deal.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-sm rounded-full ${
                            tag === "Cheapest"
                              ? "bg-green-100 text-green-700"
                              : tag === "Fastest"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

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
                    onClick={() => handleViewFlightDetails(deal.token)}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Flight Details Sidebar */}
      {showFlightDetailsSidebar && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeFlightDetailsSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div className="h-full bg-white shadow-xl flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-6 bg-blue-600 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Flight Details</h2>
                  <button 
                    onClick={closeFlightDetailsSidebar}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                  {loadingFlightDetails ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner />
                    </div>
                  ) : flightDetailsError ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                      <p>{flightDetailsError}</p>
                    </div>
                  ) : flightDetailsData ? (
                    <div className="space-y-6">
                      {/* Flight Route */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Flight Route</h2>
                        <p className="text-gray-600">
                          {flightDetailsData.segments?.[0]?.departureAirport?.name} → {flightDetailsData.segments?.[0]?.arrivalAirport?.name}
                        </p>
                      </div>

                      {/* Flight Timing */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Timing</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Departure Time</p>
                            <p className="text-gray-600">{flightDetailsData.segments?.[0]?.departureTime || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Arrival Time</p>
                            <p className="text-gray-600">{flightDetailsData.segments?.[0]?.arrivalTime || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Price</h2>
                        <p className="text-green-600 font-bold text-xl">
                          RS. {flightDetailsData.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units || "N/A"}
                        </p>
                      </div>

                      {/* Luggage Information */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Luggage Information</h2>
                        {flightDetailsData.segments?.map((segment, segmentIndex) => (
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
                            {segmentIndex !== flightDetailsData.segments.length - 1 && (
                              <hr className="my-4 border-t border-gray-300" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Flight Stops */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Flight Stops</h2>
                        {flightDetailsData.segments?.[0]?.legs?.map((leg, index) => {
                          // Remove duplicate airlines
                          const uniqueCarriers = leg.carriersData?.filter(
                            (carrier, carrierIndex, self) =>
                              self.findIndex((c) => c.name === carrier.name) === carrierIndex
                          );

                          return (
                            <div key={index} className={`mb-4 ${index !== flightDetailsData.segments[0].legs.length - 1 ? 'border-b pb-4' : ''}`}>
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
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Additional Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Cabin Class</p>
                            <p className="text-gray-600">{flightDetailsData.segments?.[0]?.cabinClass || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Trip Type</p>
                            <p className="text-gray-600">{flightDetailsData.tripType || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Supplier Information */}
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold">Supplier Information</h2>
                        {flightDetailsData.ancillaries?.flexibleTicket?.supplierInfo ? (
                          <div>
                            <p>{flightDetailsData.ancillaries.flexibleTicket.supplierInfo.name || "N/A"}</p>
                            <p>
                              <a
                                href={flightDetailsData.ancillaries.flexibleTicket.supplierInfo.privacyPolicyUrl}
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
                        {flightDetailsData.ancillaries?.travelInsurance?.content?.benefits ? (
                          <ul className="list-disc list-inside text-gray-600">
                            {flightDetailsData.ancillaries.travelInsurance.content.benefits.map((benefit, index) => (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}