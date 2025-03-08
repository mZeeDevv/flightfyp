import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import Cheap from '../Components/Cheap';
import About from '../Components/About';
import Newsletter from '../Components/Mail';
import "../App.css"; 
import bg from '../assets/254381.webp'


export default function Home() {
  const [tripType, setTripType] = useState("RETURN"); // Default to return
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [cabinClass, setCabinClass] = useState("ECONOMY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false); 
  const [dynamicHeading, setDynamicHeading] = useState("Flight"); // Dynamic heading state
  const navigate = useNavigate();

  const RAPIDAPI_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9";
  const API_HOST = "booking-com15.p.rapidapi.com";

  // Animation on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true); // Show content after animation
    }, 3000); // Adjust timing based on animation duration

    return () => clearTimeout(timer);
  }, []);

  // Dynamic heading animation (word-by-word replacement)
  useEffect(() => {
    const headings = ["Flight", "Car", "Hotel"];
    let index = 0;

    const interval = setInterval(() => {
      setDynamicHeading(headings[index]);
      index = (index + 1) % headings.length; // Cycle through headings
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const fetchAirportId = async (city) => {
    if (!city) return null;

    const url = `https://${API_HOST}/api/v1/flights/searchDestination?query=${city}`;
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

      if (result?.data?.length > 0) {
        return result.data[0].id;
      } else {
        throw new Error(`No airport found for "${city}"`);
      }
    } catch (error) {
      console.error(`Error fetching airport for "${city}":`, error);
      setError(`Could not find an airport for "${city}"`);
      return null;
    }
  };

  const handleSearch = async () => {
    setLoading(true); // Start loading effect
    setError("");

    const fromId = await fetchAirportId(from);
    const toId = await fetchAirportId(to);

    if (fromId && toId) {
      navigate("/flights", {
        state: {
          fromId,
          toId,
          departureDate,
          returnDate: tripType === "RETURN" ? returnDate : undefined, // Exclude return date if One-way
          cabinClass,
        },
      });
    } else {
      setError("Please enter valid departure and arrival cities.");
    }

    setLoading(false); // Stop loading effect
  };

  return (
    <>
      {!showContent ? (
        // Plane animation
        <div className="plane-animation">
          <FaPlane className="plane-icon" />
        </div>
      ) : (
        // Homepage content
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center bg-no-repeat bg-cover" style={{ backgroundImage: `url(${bg})` }}>
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
            {/* Dynamic Heading */}
            <h1 className="text-3xl font-bold text-center mb-6">
              Book Cheapest{" "}
              <span className="inline-block animate-word-change">{dynamicHeading}</span>
            </h1>

            {/* Trip Type Selection */}
            <div className="flex justify-center gap-6 mb-6">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  value="ONE_WAY" 
                  checked={tripType === "ONE_WAY"} 
                  onChange={() => setTripType("ONE_WAY")} 
                  className="form-radio text-indigo-600"
                />
                One-way
              </label>

              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  value="RETURN" 
                  checked={tripType === "RETURN"} 
                  onChange={() => setTripType("RETURN")} 
                  className="form-radio text-indigo-600"
                />
                Return
              </label>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">From</label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Departure city"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Arrival city"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={tripType === "ONE_WAY"} // Disable if One-way is selected
                  className={`mt-1 block w-full px-3 py-2 border ${tripType === "ONE_WAY" ? "bg-gray-200 cursor-not-allowed" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cabin Class</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option>Do not include in request</option>
                </select>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleSearch}
                disabled={loading} // Disable button while loading
                className="px-6 py-2 bg-[#111827] text-white font-semibold rounded-md hover:bg-[#0d131f] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  "Search Flights"
                )}
              </button>
            </div>
          </div>

          {error && <div className="mt-6 text-center text-red-500">{error}</div>}
        </div>
      )}
      <About/>
      <Cheap />
      <Newsletter/>

    </>
  );
}