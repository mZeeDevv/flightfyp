import React, { useState } from "react";
import { FaEnvelope, FaPaperPlane, FaCheck, FaShieldAlt, FaPlane } from "react-icons/fa";
import Mail from "../assets/Mail.png";

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const [homeAirport, setHomeAirport] = useState("Islamabad, Pakistan");
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate API call with timeout
        setTimeout(() => {
            setSubscribed(true);
            setLoading(false);
            
            // Reset form
            setEmail("");
            setAgreed(false);
            
            // Reset success message after delay
            setTimeout(() => {
                setSubscribed(false);
            }, 5000);
        }, 1500);
    };

    return (
        <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
            <div className="container mx-auto max-w-6xl">
                {/* Section heading */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Stay Updated with Travel Deals</h2>
                    <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row transform hover:shadow-2xl transition-all duration-300">
                    {/* Image Section with overlay gradient */}
                    <div className="md:w-5/12 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/60 to-purple-800/60 z-10"></div>
                        <img
                            src={Mail}
                            alt="Newsletter"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 text-white">
                            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                                <FaEnvelope className="text-4xl mb-4 text-yellow-300" />
                                <h3 className="text-2xl font-bold mb-3">JetSeeker Newsletters</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center">
                                        <FaCheck className="text-green-400 mr-2" />
                                        <span>Exclusive flight deals</span>
                                    </li>
                                    <li className="flex items-center">
                                        <FaCheck className="text-green-400 mr-2" />
                                        <span>Travel tips & inspiration</span>
                                    </li>
                                    <li className="flex items-center">
                                        <FaCheck className="text-green-400 mr-2" />
                                        <span>Personalized recommendations</span>
                                    </li>
                                    <li className="flex items-center">
                                        <FaCheck className="text-green-400 mr-2" />
                                        <span>Early access to promotions</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="p-8 md:w-7/12">
                        <div className="max-w-lg mx-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Join Our Newsletter
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Sign up to receive personalized flight deals from your favorite airports, 
                                travel inspiration, and insider tips to help you travel smarter.
                            </p>

                            {subscribed ? (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md animate-fadeIn">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <FaCheck className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-green-800 font-medium">
                                                You've successfully subscribed to our newsletter!
                                            </p>
                                            <p className="text-green-700 text-sm mt-1">
                                                Check your email inbox for a confirmation message.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="space-y-6">
                                    {/* Home Airport */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Home Airport
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={homeAirport}
                                                onChange={(e) => setHomeAirport(e.target.value)}
                                                className="w-full p-4 pl-12 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled
                                            />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FaPlane className="text-gray-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email Address */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Your Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FaEnvelope className="text-gray-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Privacy Policy Agreement */}
                                    <div className="flex items-center">
                                        <input
                                            id="privacy-policy"
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={() => setAgreed(!agreed)}
                                            required
                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <label htmlFor="privacy-policy" className="ml-3 block text-sm text-gray-700">
                                            I agree to receive offers according to the{" "}
                                            <a
                                                href="/privacy-policy"
                                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                                            >
                                                Privacy Policy
                                            </a>
                                        </label>
                                    </div>

                                    {/* Subscribe Button */}
                                    <button
                                        type="submit"
                                        disabled={!agreed || loading}
                                        className={`w-full p-4 rounded-lg transition-all duration-300 flex items-center justify-center ${
                                            agreed && !loading
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FaPaperPlane className="mr-2" />
                                                Subscribe to Newsletter
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Security notice */}
                            <div className="mt-8 flex items-center text-gray-500 text-sm">
                                <FaShieldAlt className="mr-2 text-gray-400" />
                                <p>
                                    We respect your privacy. You can unsubscribe at any time.
                                    See our{" "}
                                    <a
                                        href="/terms-of-use"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Terms of Use
                                    </a>{" "}
                                    for details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Benefits row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-lg font-bold text-blue-700 mb-2">Early Access</div>
                        <div className="text-gray-600">Get notified about flash sales before anyone else</div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-lg font-bold text-green-700 mb-2">Free Travel Guides</div>
                        <div className="text-gray-600">Receive destination guides and insider tips</div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-lg font-bold text-purple-700 mb-2">Personalization</div>
                        <div className="text-gray-600">Get deals tailored to your travel preferences</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
