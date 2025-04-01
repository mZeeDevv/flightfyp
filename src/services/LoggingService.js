import { addDoc, collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

/**
 * Logs user activity to Firebase
 * @param {string} action - The action performed (e.g., "booked", "registered")
 * @param {string} activityType - The type of activity ("flight", "hotel", "trip")
 * @param {object} details - Details about the activity
 */
export const logUserActivity = async (action, activityType, details) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn("Cannot log activity: No user is logged in");
      return;
    }

    const logEntry = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      email: user.email || '',
      action,
      activityType,
      details,
      timestamp: new Date()
    };

    await addDoc(collection(db, "user_activity_logs"), logEntry);
    console.log(`Activity logged: ${user.displayName} ${action} a ${activityType}`);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

/**
 * Fetches all user activity logs from Firebase
 */
export const fetchActivityLogs = async () => {
  try {
    const q = query(
      collection(db, "user_activity_logs"), 
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    return logs;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
};

/**
 * Fetches recent user activity logs with a limit
 * @param {number} logLimit - Maximum number of logs to fetch
 */
export const fetchRecentActivityLogs = async (logLimit = 5) => {
  try {
    const q = query(
      collection(db, "user_activity_logs"), 
      orderBy("timestamp", "desc"),
      limit(logLimit)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    return logs;
  } catch (error) {
    console.error("Error fetching recent activity logs:", error);
    return [];
  }
};
