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

function App() {
  return (
    <>
      <Router>
        <Header/>
      <Routes>
      <Route path="/" element={<Home/>} />
      <Route path='/login' element={<Login/>}/>
      <Route path='/signup' element={<Signup/>}/>
      <Route path='/profile' element={<Profile/>}/>
      </Routes>
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
