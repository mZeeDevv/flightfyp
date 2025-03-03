import React from 'react'
import CheapImg from '../assets/Cheap.webp'
export default function Cheap() {
  return (
    <>
    <div className='max-w-4xl mx-auto flex space-x-6 md:flex-row flex-col text-center items-center justify-center py-4'>
    <img src={CheapImg} alt="searchImg" width={300} />
    <div>
    <h1 className="text-2xl text-center">Cheap Car Rentals</h1>
    <div>Cheapest way to fly
    To save even more money and have more flexible travel options, Kiwi.com gives you the choice to arrive and depart from different airports.
    
    When you search for a flight to or from a city, if that city has more than one airport, Kiwi.com finds the cheapest route, even if the airport you arrive at is different from the airport you depart from.
    
    You can choose to remove this feature when you search, but to search and book the best low-cost route, this finds the cheapest way to fly.
    </div>
    </div>
    </div>
    
    </>
  )
}
