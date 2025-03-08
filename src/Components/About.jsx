import React from 'react';
import anywhereIcon from '../assets/1.avif';
import travelIcon from '../assets/2.avif';
import trustedIcon from '../assets/3.avif';

export default function About() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-10 p-10 bg-white my-3">
      
      {/* Section 1 - Anywhere Travel Hack */}
      <div className="flex flex-col items-center text-center max-w-xs">
        <img src={anywhereIcon} alt="Anywhere Travel Hack" className="" />
        <h3 className="text-xl font-semibold">One search, all the flights</h3>
        <p className="text-gray-600 mt-2">
          We find you the best flight deals and travel hacks so that you can choose how to book.
        </p>
      </div>

      {/* Section 2 - Travel Anxiety Solution */}
      <div className="flex flex-col items-center text-center max-w-xs">
        <img src={travelIcon} alt="Travel Guarantee" className="" />
        <h3 className="text-xl font-semibold">Rise above all travel anxieties</h3>
        <p className="text-gray-600 mt-2">
          With the JetSeeker Guarantee, we have your back with whatever happens.
        </p>
      </div>

      {/* Section 3 - Trusted by Millions */}
      <div className="flex flex-col items-center text-center max-w-xs">
        <img src={trustedIcon} alt="Trusted by Millions" className="" />
        <h3 className="text-xl font-semibold">Trusted by millions</h3>
        <p className="text-gray-600 mt-2">
          Join over 10 million travelers booking cheap flights with ease.
        </p>
      </div>

    </div>
  );
}
