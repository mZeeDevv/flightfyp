import React from "react";
import { FaCar, FaPlane, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import CheapImg from "../assets/Cheap.webp";

export default function Cheap() {
    return (
        <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Section heading */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                        <FaCar className="text-blue-600 mr-3" />
                        Cheap Car Rentals & Flight Options
                    </h2>
                    <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                </div>

                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Content section */}
                    <div className="p-8 md:w-1/2">
                        <h3 className="text-2xl font-bold text-blue-700 mb-4">
                            The Cheapest Way to Fly
                        </h3>

                        <p className="text-gray-700 mb-6 leading-relaxed">
                            To save even more money and have more flexible
                            travel options, JetSeeker gives you the choice to
                            arrive and depart from different airports.
                        </p>

                        <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500 mb-6">
                            <p className="text-blue-800">
                                When you search for a flight to or from a city
                                with multiple airports, we find the cheapest
                                route, even when arrival and departure airports
                                differ.
                            </p>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start">
                                <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                <p className="text-gray-700">
                                    Search across multiple airports in one city
                                </p>
                            </div>
                            <div className="flex items-start">
                                <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                <p className="text-gray-700">
                                    Find the absolute lowest prices available
                                </p>
                            </div>
                            <div className="flex items-start">
                                <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                <p className="text-gray-700">
                                    Option to disable multi-airport search if
                                    preferred
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image container */}
                    <div className="md:w-1/2 relative">
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 absolute inset-0 opacity-20 transform -skew-x-6"></div>
                        <img
                            src={CheapImg}
                            alt="Car rental and flight options"
                            className="w-full h-full object-cover relative z-10 hover:scale-105 transition-transform duration-500"
                            style={{ maxHeight: "500px" }}
                        />
                        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-2 rounded-lg shadow-md z-20 flex items-center">
                            <FaPlane className="text-blue-600 mr-2" />
                            <span className="text-blue-800 font-medium">
                                Best Price Guarantee
                            </span>
                        </div>
                    </div>
                </div>

                {/* Additional stats or highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            500+
                        </div>
                        <div className="text-gray-700">
                            Car rental companies compared
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            30%
                        </div>
                        <div className="text-gray-700">
                            Average savings on multi-airport searches
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500 hover:shadow-lg transition-shadow duration-300">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            24/7
                        </div>
                        <div className="text-gray-700">
                            Customer support for booking assistance
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
