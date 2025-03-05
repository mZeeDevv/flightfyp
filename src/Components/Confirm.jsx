import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

export default function Confirm() {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    // Check if the link is a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = localStorage.getItem("emailForSignIn");

      if (email) {
        // Complete the sign-in process
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem("emailForSignIn"); // Clear the email
            navigate("/profile"); // Redirect to profile page
          })
          .catch((error) => {
            console.error("Error signing in:", error);
          });
      }
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg">Completing sign-in...</p>
    </div>
  );
}