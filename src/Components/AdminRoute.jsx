import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!auth.currentUser) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        const db = getFirestore();
        const adminDoc = await getDoc(doc(db, "admins", auth.currentUser.uid)); 
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [auth.currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/profile" replace />;
};

export default AdminRoute;
