import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaDownload, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaPlane } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { collection, getDocs, query, orderBy, limit, getFirestore } from 'firebase/firestore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('popular');
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [bookingTrends, setBookingTrends] = useState({});
  const [seasonalTrends, setSeasonalTrends] = useState({});
  const [preferredAirlines, setPreferredAirlines] = useState([]);
  const [recentBookings, setRecentBookings] = useState({});
  const db = getFirestore();
  
  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          const dummyReports = [
            { id: 1, title: 'Monthly Revenue Report', category: 'financial', date: '2023-08-01', downloadUrl: '#' },
            { id: 2, title: 'User Activity Summary', category: 'user', date: '2023-07-15', downloadUrl: '#' },
            { id: 3, title: 'Flight Bookings Analysis', category: 'bookings', date: '2023-07-01', downloadUrl: '#' },
            { id: 4, title: 'Hotel Reservation Trends', category: 'bookings', date: '2023-06-15', downloadUrl: '#' },
            { id: 5, title: 'System Performance Metrics', category: 'system', date: '2023-06-01', downloadUrl: '#' },
          ];
          setReports(dummyReports);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setLoading(false);
      }
    };
    
    fetchReports();
  }, []);
  
  useEffect(() => {
    setLoadingAnalytics(true);
    console.log('Starting to fetch analytics data...');
    
    const fetchAnalyticsData = async () => {
      try {
        // Fetch user flights data
        await fetchUserFlightsData();
        // Fetch favorite trips data
        await fetchFavoriteTripsData();
        
        setLoadingAnalytics(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoadingAnalytics(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);
  
  // Fetch and process user flights data
  const fetchUserFlightsData = async () => {
    try {
      console.log('Fetching user flights data from Firebase...');
      const userFlightsRef = collection(db, 'user_flights');
      const userFlightsSnapshot = await getDocs(userFlightsRef);
      
      console.log(`Firestore query completed. Found ${userFlightsSnapshot.size} documents.`);
      
      if (userFlightsSnapshot.empty) {
        console.log('⚠️ No user flights found in the collection');
        return;
      }
      
      const flightsData = [];
      userFlightsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Document ID:', doc.id);
        console.log('Document data keys:', Object.keys(data));
        
        
        const flightDetails = data.flightDetails || {};
        
        flightsData.push({
          id: doc.id,
          from: flightDetails.departure || data.from || 'Unknown',
          to: flightDetails.arrival || data.to || 'Unknown',
          airline: data.airline || flightDetails.airline || 'Unknown',
          bookingDate: data.createdAt || data.bookingDate || new Date().toISOString(),
          travelDate: flightDetails.departureTime || data.travelDate || data.date,
          price: parseFloat(data.amount || flightDetails.price || 0)
        });
      });
      
      console.log('Processed flights data (first 3):', flightsData.slice(0, 3));
      console.log(`Total flights processed: ${flightsData.length}`);
      
      // Process destinations popularity
      const destinationCounts = {};
      flightsData.forEach(flight => {
        if (flight.to && flight.to !== 'Unknown') {
          destinationCounts[flight.to] = (destinationCounts[flight.to] || 0) + 1;
        } else {
          console.log('⚠️ Flight has no destination:', flight);
        }
      });
      
      console.log('Destination counts:', destinationCounts);
      console.log(`Number of unique destinations: ${Object.keys(destinationCounts).length}`);
      
      // Check if we have any destinations
      if (Object.keys(destinationCounts).length === 0) {
        console.log('⚠️ No destinations found in flight data');
        setPopularDestinations([]);
        return;
      }
      
      // Convert to array and sort
      const destinations = Object.entries(destinationCounts)
        .map(([destination, count]) => ({
          destination,
          count,
          // Simulating percentage change as we don't have historical data
          percentageChange: Math.round((Math.random() * 40) - 10)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Take top 8 destinations
      
      console.log('Processed destinations data:', destinations);
      setPopularDestinations(destinations);
      
      // Process airline preferences
      const airlineCounts = {};
      let totalFlights = 0;
      
      flightsData.forEach(flight => {
        if (flight.airline && flight.airline !== 'Unknown') {
          airlineCounts[flight.airline] = (airlineCounts[flight.airline] || 0) + 1;
          totalFlights++;
        }
      });
      
      // Convert to percentage
      const airlines = Object.entries(airlineCounts)
        .map(([airline, count]) => ({
          airline,
          percentage: Math.round((count / totalFlights) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage);
      
      // Ensure we don't have too many slices in the pie chart
      let topAirlines = airlines.slice(0, 5);
      
      // Add "Other" category if there are more airlines
      if (airlines.length > 5) {
        const otherPercentage = airlines.slice(5).reduce((sum, airline) => sum + airline.percentage, 0);
        topAirlines.push({ airline: 'Other Airlines', percentage: otherPercentage });
      }
      
      setPreferredAirlines(topAirlines);
      
      // Process booking trends
      const bookingLeadTimes = {
        '12+ weeks': { count: 0, totalFare: 0 },
        '8-12 weeks': { count: 0, totalFare: 0 },
        '4-8 weeks': { count: 0, totalFare: 0 },
        '2-4 weeks': { count: 0, totalFare: 0 },
        '1-2 weeks': { count: 0, totalFare: 0 },
        '<1 week': { count: 0, totalFare: 0 }
      };
      
      flightsData.forEach(flight => {
        if (flight.bookingDate && flight.travelDate && flight.price) {
          const bookingDate = new Date(flight.bookingDate);
          const travelDate = new Date(flight.travelDate);
          const diffDays = Math.ceil((travelDate - bookingDate) / (1000 * 60 * 60 * 24));
          
          let category;
          if (diffDays >= 84) category = '12+ weeks';
          else if (diffDays >= 56) category = '8-12 weeks';
          else if (diffDays >= 28) category = '4-8 weeks';
          else if (diffDays >= 14) category = '2-4 weeks';
          else if (diffDays >= 7) category = '1-2 weeks';
          else category = '<1 week';
          
          bookingLeadTimes[category].count++;
          bookingLeadTimes[category].totalFare += parseFloat(flight.price);
        }
      });
      
      // Calculate average fares and create chart data
      const bookingTrendsData = {
        labels: Object.keys(bookingLeadTimes),
        datasets: [
          {
            label: 'Average Fare (PKR)',
            data: Object.values(bookingLeadTimes).map(data => 
              data.count > 0 ? Math.round(data.totalFare / data.count) : 0
            ),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Booking Volume',
            data: Object.values(bookingLeadTimes).map(data => data.count),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
        ]
      };
      
      setBookingTrends(bookingTrendsData);
      
      // Process seasonal booking patterns
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const bookingsByMonth = Array(12).fill(0);
      
      flightsData.forEach(flight => {
        if (flight.travelDate) {
          const travelDate = new Date(flight.travelDate);
          const monthIndex = travelDate.getMonth();
          bookingsByMonth[monthIndex]++;
        }
      });
      
      const seasonalTrendsData = {
        labels: months,
        datasets: [
          {
            label: 'Booking Volume',
            data: bookingsByMonth,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true,
          }
        ]
      };
      
      setSeasonalTrends(seasonalTrendsData);
      
      // Process recent bookings (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Create array of past 30 days
      const last30Days = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        last30Days.unshift(date.toISOString().split('T')[0]);
      }
      
      // Count bookings for each day
      const dailyBookingCounts = {};
      last30Days.forEach(day => {
        dailyBookingCounts[day] = 0;
      });
      
      // Process flight data to count bookings by date
      flightsData.forEach(flight => {
        if (flight.bookingDate) {
          const bookingDate = new Date(flight.bookingDate);
          if (bookingDate >= thirtyDaysAgo && bookingDate <= today) {
            const dateString = bookingDate.toISOString().split('T')[0];
            if (dailyBookingCounts[dateString] !== undefined) {
              dailyBookingCounts[dateString]++;
            }
          }
        }
      });
      
      // Calculate rolling average (7-day)
      const rollingAverages = [];
      for (let i = 6; i < 30; i++) {
        let sum = 0;
        for (let j = i - 6; j <= i; j++) {
          sum += dailyBookingCounts[last30Days[j]] || 0;
        }
        rollingAverages.push(Math.round((sum / 7) * 10) / 10); // Round to 1 decimal place
      }
      
      // Format dates for display (e.g., "Jun 15")
      const formattedDates = last30Days.map(dateStr => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      // Create chart data for recent bookings
      const recentBookingsData = {
        labels: formattedDates,
        datasets: [
          {
            label: 'Daily Bookings',
            data: Object.values(dailyBookingCounts),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            type: 'bar'
          },
          {
            label: '7-Day Average',
            data: [...Array(6).fill(null), ...rollingAverages], // Pad with nulls for the first 6 days
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            type: 'line',
            pointRadius: 2
          }
        ]
      };
      
      // Calculate current trend compared to previous period
      const currentPeriodBookings = Object.values(dailyBookingCounts).slice(15).reduce((sum, count) => sum + count, 0);
      const previousPeriodBookings = Object.values(dailyBookingCounts).slice(0, 15).reduce((sum, count) => sum + count, 0);
      
      const percentChange = previousPeriodBookings === 0 
        ? 100 // If previous period had 0 bookings, show 100% increase
        : Math.round(((currentPeriodBookings - previousPeriodBookings) / previousPeriodBookings) * 100);
      
      setRecentBookings({
        chartData: recentBookingsData,
        totalBookings: Object.values(dailyBookingCounts).reduce((sum, count) => sum + count, 0),
        trend: percentChange,
        average: Math.round((Object.values(dailyBookingCounts).reduce((sum, count) => sum + count, 0) / 30) * 10) / 10
      });
      
    } catch (error) {
      console.error('Error processing user flights data:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  };
  
  // Fetch and process favorite trips data
  const fetchFavoriteTripsData = async () => {
    try {
      console.log('Fetching favorite trips data from Firebase...');
      const favTripsRef = collection(db, 'user_fav_trips');
      const favTripsSnapshot = await getDocs(favTripsRef);
      
      console.log(`Firestore query completed. Found ${favTripsSnapshot.size} fav trips documents.`);
      
      if (favTripsSnapshot.empty) {
        console.log('No favorite trips found');
        return;
      }
      
      // Extract favorite trips data based on FavTrips.jsx structure
      const tripsData = [];
      favTripsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Document ID:', doc.id);
        console.log('Favorite trip data keys:', Object.keys(data));
        
        const flight = data.flight || {};
        const hotel = data.hotel || {};
        
        tripsData.push({
          id: doc.id,
          userId: data.userId,
          tripId: data.tripId,
          flight: {
            from: flight.departure || "Unknown",
            to: flight.arrival || "Unknown",
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            airline: flight.airline || "Unknown"
          },
          hotel: {
            name: hotel.name || "Unknown",
            location: hotel.location || "Unknown",
            checkIn: hotel.checkIn,
            checkOut: hotel.checkOut
          },
          createdAt: data.createdAt
        });
      });
      
      console.log('Processed favorite trips data (first 3):', tripsData.slice(0, 3));
      console.log(`Total favorite trips processed: ${tripsData.length}`);
      
      // We could expand this to analyze favorite vs booked trips
      // For now we're just grabbing the data structure
      
    } catch (error) {
      console.error('Error processing favorite trips data:', error);
      throw error;
    }
  };
  
  // Filter reports based on selected category
  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.category === filter);

  // Format date to readable format without date-fns
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Prepare data for pie chart of preferred airlines
  const airlinesPieData = {
    labels: preferredAirlines.map(item => item.airline),
    datasets: [
      {
        data: preferredAirlines.map(item => item.percentage),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Travel Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Insights into travel patterns and booking statistics</p>
      </div>
      
      {/* Analytics Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('popular')}
            className={`${
              activeTab === 'popular'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaMapMarkerAlt className="mr-2" />
            Popular Destinations
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`${
              activeTab === 'booking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaCalendarAlt className="mr-2" />
            Booking Insights
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaFileAlt className="mr-2" />
            Reports
          </button>
        </nav>
      </div>
      
      {/* Popular Destinations Tab */}
      {activeTab === 'popular' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Destinations Card */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Destinations</h2>
            {loadingAnalytics ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : popularDestinations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No destination data available. 
                  {console.log('Rendering "No destination data" message. popularDestinations:', popularDestinations)}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Check browser console for debugging information.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {console.log('Rendering destination table with data:', popularDestinations)}
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {popularDestinations.map((destination, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <FaMapMarkerAlt />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{destination.destination}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {destination.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            destination.percentageChange >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {destination.percentageChange >= 0 ? '+' : ''}{destination.percentageChange}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Preferred Airlines Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferred Airlines</h2>
            {loadingAnalytics ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : preferredAirlines.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No airline preference data available.</p>
              </div>
            ) : (
              <>
                <div className="h-64">
                  <Pie data={airlinesPieData} />
                </div>
                <div className="mt-6 space-y-2">
                  {preferredAirlines.slice(0, 3).map((airline, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{airline.airline}</span>
                      <span className="text-sm font-medium">{airline.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Booking Insights Tab */}
      {activeTab === 'booking' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Booking Activity (Last 30 Days) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Booking Activity</h2>
            <p className="text-gray-600 mb-6">Booking trends over the last 30 days</p>
            
            {loadingAnalytics ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : !recentBookings.chartData ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Insufficient recent booking data available.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Total 30-Day Bookings</h3>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{recentBookings.totalBookings}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-800">Daily Average</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{recentBookings.average}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${recentBookings.trend >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <h3 className="text-sm font-medium text-gray-800">Current Trend</h3>
                    <p className={`text-2xl font-bold mt-2 ${recentBookings.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {recentBookings.trend >= 0 ? '+' : ''}{recentBookings.trend}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">vs. previous 15 days</p>
                  </div>
                </div>
                
                <div className="h-80">
                  <Bar 
                    data={recentBookings.chartData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Daily Booking Volume'
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Optimal Booking Time Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Optimal Booking Times</h2>
            <p className="text-gray-600 mb-6">Analysis of fare prices vs. booking lead time</p>
            
            {loadingAnalytics ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : !bookingTrends.datasets || !bookingTrends.datasets[0].data.some(val => val > 0) ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Insufficient booking data to analyze lead times.</p>
              </div>
            ) : (
              <>
                <div className="h-80">
                  <Bar 
                    data={bookingTrends} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Average Fare vs. Booking Time'
                        }
                      }
                    }} 
                  />
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Key Insight:</h3>
                  <p className="text-blue-800 mt-1">
                    {(() => {
                      // Find the cheapest average fare and its index
                      if (!bookingTrends.datasets || !bookingTrends.datasets[0].data) return 'Insufficient data';
                      
                      const avgFares = bookingTrends.datasets[0].data;
                      let minFareIndex = 0;
                      let minFare = Number.MAX_VALUE;
                      
                      avgFares.forEach((fare, index) => {
                        if (fare > 0 && fare < minFare) {
                          minFare = fare;
                          minFareIndex = index;
                        }
                      });
                      
                      return `Booking ${bookingTrends.labels[minFareIndex]} in advance typically offers the best fares.`;
                    })()}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Seasonal Trends Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Seasonal Booking Patterns</h2>
            <p className="text-gray-600 mb-6">Monthly booking volume across the year</p>
            
            {loadingAnalytics ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : !seasonalTrends.datasets || !seasonalTrends.datasets[0].data.some(val => val > 0) ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Insufficient data for seasonal analysis.</p>
              </div>
            ) : (
              <>
                <div className="h-80">
                  <Line 
                    data={seasonalTrends}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Monthly Booking Volume'
                        }
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {(() => {
                    if (!seasonalTrends.datasets || !seasonalTrends.datasets[0].data) return null;
                    
                    const bookingsByMonth = seasonalTrends.datasets[0].data;
                    const months = seasonalTrends.labels;
                    
                    // Find peak season (max bookings)
                    let peakMonthIndex = 0;
                    let peakValue = 0;
                    
                    // Find off-peak season (min bookings, excluding months with 0)
                    let offPeakMonthIndex = 0;
                    let offPeakValue = Number.MAX_VALUE;
                    
                    bookingsByMonth.forEach((bookings, index) => {
                      if (bookings > peakValue) {
                        peakValue = bookings;
                        peakMonthIndex = index;
                      }
                      if (bookings > 0 && bookings < offPeakValue) {
                        offPeakValue = bookings;
                        offPeakMonthIndex = index;
                      }
                    });
                    
                    return (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h3 className="font-medium text-green-900">Peak Season:</h3>
                          <p className="text-green-800 mt-1">{months[peakMonthIndex]} has the highest booking volume</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <h3 className="font-medium text-amber-900">Off-Peak Season:</h3>
                          <p className="text-amber-800 mt-1">{months[offPeakMonthIndex]} offers potential for better deals</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {/* Filter Controls */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <FaFilter className="text-gray-500 mr-2" />
              <span className="mr-4 font-medium">Filter by:</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFilter('all')} 
                  className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Reports
                </button>
                <button 
                  onClick={() => setFilter('financial')} 
                  className={`px-3 py-1 rounded-full text-sm ${filter === 'financial' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Financials
                </button>
                <button 
                  onClick={() => setFilter('user')} 
                  className={`px-3 py-1 rounded-full text-sm ${filter === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  User Activity
                </button>
                <button 
                  onClick={() => setFilter('bookings')} 
                  className={`px-3 py-1 rounded-full text-sm ${filter === 'bookings' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Bookings
                </button>
                <button 
                  onClick={() => setFilter('system')} 
                  className={`px-3 py-1 rounded-full text-sm ${filter === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  System
                </button>
              </div>
            </div>
          </div>
          
          {/* Reports List */}
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No reports found for the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                              <FaFileAlt className="text-blue-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{report.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href={report.downloadUrl} className="text-blue-600 hover:text-blue-900 flex items-center">
                            <FaDownload className="mr-1" /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
