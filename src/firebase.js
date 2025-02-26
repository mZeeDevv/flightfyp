import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA4VeHPB2LajOK0DKlCbK5lp3XcB5vbXsE",
    authDomain: "flighfinder.firebaseapp.com",
    projectId: "flighfinder",
    storageBucket: "flighfinder.firebasestorage.app",
    messagingSenderId: "1068807590764",
    appId: "1:1068807590764:web:b87136dbe13750cd555949",
    measurementId: "G-X6R31RK777"
  };

initializeApp(firebaseConfig);
export const db = getFirestore();