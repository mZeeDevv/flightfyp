import { ToastContainer,toast } from 'react-toastify';
import './index.css'
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
//Pages
import Home from './Pages/Home'
import Profile from './Pages/Profile'
// Auth
import Login from './Auth/Login'
import Signup from './Auth/Signup';
// Components
import Header from './Components/Header'
import Footer from './Components/Footer'
// Flights
import Flights from './Flights/Flights'
// Airports
import Airports from './Pages/Airports'
// Cars
import Cars from './Pages/Cars'



function App() {
  return (
    <>
      <Router>
        <Header/>
        {/* <FetchAirports/> */}
      <Routes>
      <Route path="/" element={<Home/>} />
      <Route path='/login' element={<Login/>}/>
      <Route path='/signup' element={<Signup/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path='/airports' element={<Airports/>}/>
      <Route path='/carshire' element={<Cars/>}/>
      <Route path='/flights' element={<Flights/>}/>
      </Routes>
      <Footer/>
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
    </>
    
  )
}
export default App
