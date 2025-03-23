import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTrash, FaEnvelope, FaUser, FaCalendarAlt, FaPlane } from 'react-icons/fa';

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const q = query(collection(db, "subscriptions"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const subscriptionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Unknown'
        }));
        
        setSubscriptions(subscriptionsData);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        setError("Failed to load subscriptions data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteDoc(doc(db, "subscriptions", id));
        setSubscriptions(subscriptions.filter(sub => sub.id !== id));
      } catch (err) {
        console.error("Error deleting subscription:", err);
        alert("Failed to delete subscription");
      }
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
      <p className="font-medium">{error}</p>
    </div>
  );

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">Newsletter Subscriptions</h2>
        <p className="text-blue-100">Total subscribers: {subscriptions.length}</p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No subscriptions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Airport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Subscribed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaEnvelope className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{subscription.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaPlane className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">{subscription.homeAirport || "Not specified"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">{subscription.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
