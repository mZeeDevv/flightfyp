import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrmiuaY7ogoe3YLvLe_7EjtFgOx0Rc964",
  authDomain: "realtor-clone-dd9da.firebaseapp.com",
  projectId: "realtor-clone-dd9da",
  storageBucket: "realtor-clone-dd9da.appspot.com",
  messagingSenderId: "177826776686",
  appId: "1:177826776686:web:35435beb268826fb43887f"
};


initializeApp(firebaseConfig);
export const db = getFirestore();