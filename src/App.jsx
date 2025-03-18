import { ToastContainer, toast } from "react-toastify";
import "./index.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react"; // Add state for mobile sidebar toggle
// Pages
import Home from "./Pages/Home";
import Profile from "./Pages/Profile";
// Auth
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";
import Confirm from "./Components/Confirm";
// Components
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import UserFlights from "./Components/UserFlights";
import Sidebar from "./Components/Sidebar";
// Flights
import Flights from "./Flights/Flights";
import FlightDetails from "./Flights/FlightDetails";
// Airports
import Airports from "./Pages/Airports";
// Cars
import Cars from "./Pages/Cars";
import Taxi from './Pages/Taxi';
// Admin
import Admin from "./AdminDashboard/Admin";
// Feedback
import Feedback from "./Feedback/Feedback";
// Payment
import Payment from "./Flights/Payment";
// Hotel
import HotelSearch from "./Pages/Hotels";
import BudgetPlanner from './Planner/BudgetPlanner';
// Layout Component for Sidebar
function SidebarLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-16 left-4 z-50 bg-blue-500 text-white p-2 rounded-md shadow-lg"
      >
        {isMobileMenuOpen ? "✕" : "☰"}
      </button>
      <div
        className={`
          fixed md:static w-64 h-full transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          top-16 bottom-16 z-30 bg-white shadow-lg
        `}
      >
        <Sidebar currentPath={location.pathname} />
      </div>

      <main className="flex-1 w-full">
        {children}
      </main>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Router>
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/airports" element={<Airports />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/confirm" element={<Confirm />} />
            <Route path="/flight-details" element={<FlightDetails />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/taxi" element={<Taxi />} />
            <Route path="/hotels" element={<HotelSearch />} />
            <Route path="/budget-planner" element={<BudgetPlanner />} />
            <Route
              path="/profile/*"
              element={
                <SidebarLayout>
                  <Profile />
                </SidebarLayout>
              }
            />
            <Route
              path="/my-flights"
              element={
                <SidebarLayout>
                  <UserFlights />
                </SidebarLayout>
              }
            />
            <Route
              path="/my-cars"
              element={
                <SidebarLayout>
                  <div>My Cars Page</div>
                </SidebarLayout>
              }
            />
            <Route
              path="/my-hotels"
              element={
                <SidebarLayout>
                  <div>My Hotels Page</div>
                </SidebarLayout>
              }
            />
            <Route
              path="/feedback"
              element={
                <SidebarLayout>
                  <Feedback />
                </SidebarLayout>
              }
            />
          </Routes>
        </div>
        <Footer />
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;