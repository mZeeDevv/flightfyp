import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export default function AdminFeedback() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        const feedbackRef = collection(db, "feedback");
        const q = query(feedbackRef, orderBy("timestamp", "desc")); 
        const feedbackSnapshot = await getDocs(q);
        if (feedbackSnapshot.empty) {
          setFeedbackData([]);
          return;
        }

        const feedbackList = [];
        for (const doc of feedbackSnapshot.docs) {
          try {
            const feedback = doc.data();
           
            // Check if feedback document has all required data
            if (!feedback) {
              continue;
            }

            // Add feedback even without user info temporarily to test
            const feedbackEntry = {
              id: doc.id,
              ...feedback,
              userName: "Loading...",
            };
            
            // Safely handle timestamp conversion
            if (feedback.timestamp) {
              try {
                if (typeof feedback.timestamp.toDate === 'function') {
                  feedbackEntry.formattedDate = feedback.timestamp.toDate().toLocaleString();
                } else {
                  // Handle non-Firestore timestamp objects
                  feedbackEntry.formattedDate = new Date(feedback.timestamp).toLocaleString();
                }
              } catch (dateError) {
                console.error("Error formatting date:", dateError);
                feedbackEntry.formattedDate = "Invalid Date";
              }
            }
            
            feedbackList.push(feedbackEntry);
            
            const userId = feedback.userId;
            if (!userId) {
              feedbackEntry.userName = "Unknown User";
              continue;
            }
            
            // Fetch user data - do this after already adding to list
            const userRef = collection(db, "users");
            const userQuery = query(userRef, where("uid", "==", userId));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              console.log(`Found user data for ${userId}:`, userData);
              // Update the already added feedback entry with user info
              feedbackEntry.userName = userData.name || "No Name";
            } else {
              
              feedbackEntry.userName = "Unknown User";
            }
          } catch (processingError) {
            console.error(`Error processing feedback ${doc.id}:`, processingError);
          }
        }
        // Check if we have data before setting state
        if (feedbackList.length > 0) {
          setFeedbackData(feedbackList);
        } else {
          console.warn("No feedback data was successfully processed");
          setFeedbackData([]);
        }
      } catch (error) {
        console.error("Error in fetchFeedbackData:", error);
        if (error.stack) {
          console.error("Stack trace:", error.stack);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Feedback Management</h1>

      <div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-50">
              <h2 className="text-xl font-semibold">User Feedback</h2>
              <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                Total: {feedbackData.length}
              </span>
            </div>
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
                        {feedback.userName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 max-w-[300px] overflow-auto text-sm text-gray-900">
                        {feedback.feedback || "No feedback text"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {feedback.travelClass || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {feedback.formattedDate || 
                         (feedback.timestamp?.toDate && feedback.timestamp.toDate().toLocaleString()) || 
                         "No date"}
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
    </div>
  );
}
