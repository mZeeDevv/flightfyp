import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Import your Firebase configuration
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaLightbulb, FaHandsHelping, FaHeart, FaComments } from "react-icons/fa";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const [travelClass, setTravelClass] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  // Remove duplicate navigate declaration
  
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!feedback) {
      toast.error("Please enter your feedback");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to submit feedback");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      // Save feedback to Firestore
      const feedbackRef = collection(db, "feedback");
      await addDoc(feedbackRef, {
        userId: userId,
        feedback: feedback,
        travelClass: travelClass || "Not specified", // Save travel class if selected
        timestamp: new Date(),
      });

      toast.success("Thank you for your feedback!");
      navigate("/profile")
    } catch (error) {
      toast.error("Error submitting feedback");
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex items-center">
      <div className="bg-white shadow-md overflow-hidden flex flex-col md:flex-row w-full min-h-screen">
        {/* Notes Section */}
        <div className="p-8 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">How We Handle Feedback</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <FaLightbulb className="text-2xl mr-4 flex-shrink-0 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">We Value Your Input</h3>
                <p className="text-gray-600">
                  Your feedback helps us improve our services and create a better experience for you.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaHandsHelping className="text-2xl mr-4 flex-shrink-0 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Action-Oriented</h3>
                <p className="text-gray-600">
                  We review every piece of feedback and take actionable steps to address your concerns.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaHeart className="text-2xl mr-4 flex-shrink-0 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Customer-Centric</h3>
                <p className="text-gray-600">
                  Your satisfaction is our priority. We use your feedback to tailor our services to your needs.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaComments className="text-2xl mr-4 flex-shrink-0 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Open Communication</h3>
                <p className="text-gray-600">
                  We believe in transparency and will keep you updated on how your feedback is being used.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form Section */}
        <div className="p-8 md:w-1/2 bg-gray-50 flex flex-col justify-center border-l border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Submit Feedback</h2>
          <form onSubmit={handleSubmitFeedback}>
            {/* Travel Class Dropdown */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Travel Class</label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              >
                <option value="">Select Travel Class</option>
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="">Do not include in request</option>
              </select>
            </div>

            {/* Feedback Textarea */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Your Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                rows="5"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}