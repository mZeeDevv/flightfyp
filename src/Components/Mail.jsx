import React, { useState } from "react";
import Mail from '../assets/Mail.png'; // Import your image

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [homeAirport, setHomeAirport] = useState("Islamabad, Pakistan");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Simulate subscription logic
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
    }, 3000); // Reset after 3 seconds
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row w-full max-w-6xl">
        {/* Image Section */}
        <div className="md:w-1/2">
          <img
            src={Mail}
            alt="Newsletter"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="p-8 md:w-1/2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Subscribe to the JetSeeker Newsletter
          </h2>
          <p className="text-gray-600 mb-6">
            Receive exclusive deals and offers straight to your inbox.
          </p>

          <form onSubmit={handleSubscribe}>
            {/* Home Airport */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Airport
              </label>
              <input
                type="text"
                value={homeAirport}
                onChange={(e) => setHomeAirport(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>

            {/* Email Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Privacy Policy Agreement */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  required
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">
                  I agree to receive offers according to conditions mentioned in our{" "}
                  <a href="/privacy-policy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            {/* Subscribe Button */}
            <button
              type="submit"
              className="w-full bg-gray-950 text-white p-3 rounded-lg hover:bg-gray-800 transition duration-300"
            >
              Subscribe
            </button>
          </form>

          {/* Subscription Success Message */}
          {subscribed && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Thank you for subscribing!
            </div>
          )}

          {/* Terms of Use */}
          <p className="mt-6 text-sm text-gray-500 text-center">
            The newsletter is governed by these{" "}
            <a href="/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}