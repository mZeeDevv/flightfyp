import { ToastContainer,toast } from 'react-toastify';
import './index.css'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

function App() {
  return (
    <>
      <div>
        <h1
        onClick={() => {
          toast.success("HELLO WORLD")
        }}
        >
          This site is being updated.
           </h1>
      </div>
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
