import { useEffect, useState } from "react";

const API_URL = "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport";
const API_KEY = "aa933760d8msh85d65c4408d29f9p1cebc5jsn51f83597dca9"; // Replace if needed

function FetchAirports() {
  const [airports, setAirports] = useState([]); // Ensure state is an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchQuery = "Pakistan"; // Hardcoded search query

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch(`${API_URL}?query=${searchQuery}`, {
          method: "GET",
          headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": "sky-scrapper.p.rapidapi.com",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        console.log("API Response:", result); // Debugging log

        // Extract the "data" array
        if (result?.data && Array.isArray(result.data)) {
          setAirports(result.data); // Correctly setting only the airport array
        } else {
          throw new Error("Invalid response format: 'data' key missing or not an array.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Airports in {searchQuery}</h2>
      {airports.length > 0 ? (
        <ul>
          {airports.map((airport, index) => (
            <li key={index}>{airport.name} ({airport.code})</li>
          ))}
        </ul>
      ) : (
        <p>No airports found.</p>
      )}
    </div>
  );
}

export default FetchAirports;
