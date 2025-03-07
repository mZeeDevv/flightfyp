import React from 'react'
import spinner from "../assets/Spinner.svg"
export default function Spinner() {
  return (
    <div className='flex items-center justify-center fixed left-0 right-0 bottom-0 top-0  bg-opacity-50 min-h-screen'>
        <div>
            <img src={spinner} alt="loading" className='h-24' />
        </div>
    </div>
  )
}