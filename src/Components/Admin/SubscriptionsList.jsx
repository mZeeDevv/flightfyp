import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTrash, FaEnvelope, FaCalendarAlt, FaPlane, FaPaperPlane } from 'react-icons/fa';

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [emailError, setEmailError] = useState(null);

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

  const handleOpenEmailModal = () => {
    setSelectedSubscribers(subscriptions.map(sub => sub.email));
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailSubject('');
    setEmailContent('');
    setSendingEmail(false);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent || selectedSubscribers.length === 0) {
      alert("Please fill all fields and select at least one subscriber");
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    
    try {
      const response = await fetch('http://localhost:3001/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedSubscribers,
          subject: emailSubject,
          content: emailContent
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      alert(result.message || 'Emails sent successfully!');
      
      // await addDoc(collection(db, "sentEmails"), {
      //   recipients: selectedSubscribers,
      //   subject: emailSubject,
      //   content: emailContent,
      //   sentAt: new Date(),
      //   successCount: selectedSubscribers.length
      // });
      
      handleCloseEmailModal();
    } catch (err) {
      console.error("Error sending email:", err);
      setEmailError(`Failed to send email: ${err.message}`);
    } finally {
      setSendingEmail(false);
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Newsletter Subscriptions</h2>
            <p className="text-blue-100">Total subscribers: {subscriptions.length}</p>
          </div>
          {subscriptions.length > 0 && (
            <button 
              onClick={handleOpenEmailModal}
              className="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-blue-50 flex items-center"
            >
              <FaPaperPlane className="mr-2" />
              Send Newsletter
            </button>
          )}
        </div>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Send Newsletter Email</h3>
            </div>
            <div className="p-4">
              {emailError && (
                <div className="mb-4 bg-red-50 p-4 rounded-md text-red-800">
                  <p className="font-medium">{emailError}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Recipients ({selectedSubscribers.length})
                </label>
                <div className="bg-gray-100 p-2 rounded text-sm max-h-20 overflow-y-auto">
                  {selectedSubscribers.join(", ")}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Email subject"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                  Content
                </label>
                <textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="6"
                  placeholder="Write your newsletter here..."
                ></textarea>
              </div>
              {/* <div className="mt-4 bg-yellow-50 p-3 rounded-md text-sm">
                <p className="font-medium text-yellow-800">Important Note:</p>
                <p className="text-yellow-700 mt-1">
                  Emails will be sent using Nodemailer from your personal email account.
                  Make sure you've started the email server and configured your email credentials.
                </p>
              </div> */}
            </div>
            <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                  sendingEmail ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {sendingEmail ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseEmailModal}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
