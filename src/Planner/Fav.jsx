import React from "react";
import { db } from "../firebase"; 
import {collection, addDoc} from "firebase/firestore";

const AddToFavorites = ({ flight, hotel, userId }) => {
  const handleAddToFavorites = async () => {
    if (!flight || !hotel || !userId) {
      alert("Please select both a flight and a hotel.");
      return;
    }

    try {
      // Save the trip data to Firebase
      const tripData = {
        userId, // Associate the trip with the user
        flight,
        hotel,
        timestamp: new Date().toISOString(), // Add a timestamp
      };

      // Add the trip to the "user_fav_trips" collection
      const docRef = await addDoc(collection(db, "user_fav_trips"), tripData);
      console.log("Trip saved to favorites with ID:", docRef.id);
      alert("Trip added to favorites!");
    } catch (error) {
      console.error("Error saving trip to favorites:", error);
      alert("Failed to save trip to favorites. Please try again.");
    }
  };

  return (
    <button
      onClick={handleAddToFavorites}
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300"
    >
      Add to Favorites
    </button>
  );
};

export default AddToFavorites;