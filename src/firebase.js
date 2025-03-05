import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAz4XS5lf2fcAPPrE_le8gIV68FoLTw-Ws",
  authDomain: "realtor-clone-dd9da.firebaseapp.com",
  projectId: "realtor-clone-dd9da",
  storageBucket: "realtor-clone-dd9da.appspot.com",
  messagingSenderId: "177826776686",
  appId: "1:177826776686:web:a9eb6daf917e72af43887f"
};

initializeApp(firebaseConfig);
export const db = getFirestore();