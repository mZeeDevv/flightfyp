import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import AdminChat from "../Components/AdminChat";

export default function Admin() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        const feedbackRef = collection(db, "feedback");
        const q = query(feedbackRef, orderBy("timestamp", "desc")); 
        const feedbackSnapshot = await getDocs(q);

        console.log("Feedback Snapshot:", feedbackSnapshot.docs);

        const feedbackList = [];
        for (const doc of feedbackSnapshot.docs) {
          const feedback = doc.data();
          const userId = feedback.userId;
          // Fetch user data for the corresponding userId
          const userRef = collection(db, "users");
          const userQuery = query(userRef, where("uid", "==", userId)); // Ensure this matches your Firestore structure
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            feedbackList.push({
              id: doc.id,
              ...feedback,
              userName: userData.name, 
            });
          } else {
            
          }
        }
        setFeedbackData(feedbackList);
      } catch (error) {
        console.error("Error fetching feedback data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, []);

  console.log(feedbackData)
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Travel Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbackData.length > 0 ? (
                    feedbackData.map((feedback) => (
                      <tr key={feedback.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feedback.userName}
                        </td>
                        <td className="px-6 py-4 max-w-[300px] overflow-auto text-sm text-gray-900">
                          {feedback.feedback}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feedback.travelClass || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feedback.timestamp?.toDate().toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No feedback found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <AdminChat />
        </div>
      </div>
    </div>
  );
}