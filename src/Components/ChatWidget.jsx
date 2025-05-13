import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null); // Store user info (name and email)
    const [authChecked, setAuthChecked] = useState(false); // Flag to check if auth has been checked
    const messagesEndRef = useRef(null);    useEffect(() => {
        const newSocket = io('http://localhost:4000', {
            transports: ['websocket', 'polling'],
        });
        setSocket(newSocket);

        // Check if user is logged in with Firebase Auth
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is signed in
                try {
                    // Try to get additional user info from Firestore
                    const db = getFirestore();
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("email", "==", currentUser.email));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        // Use data from Firestore
                        const userData = querySnapshot.docs[0].data();
                        setUser({
                            name: userData.name || currentUser.displayName || "User",
                            email: currentUser.email
                        });
                    } else {
                        // Fallback to Auth data
                        setUser({
                            name: currentUser.displayName || "User",
                            email: currentUser.email
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Fallback to Auth data on error
                    setUser({
                        name: currentUser.displayName || "User",
                        email: currentUser.email
                    });
                }
            }
            setAuthChecked(true);
        });

        return () => {
            newSocket.close();
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('admin-message', (messageData) => {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: messageData.text,
                        username: messageData.username,
                        from: 'admin',
                    },
                ]);
            });
        }
    }, [socket]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && socket && user) {
            const messageData = {
                text: message,
                username: user.name,
                email: user.email,
            };
            socket.emit('user-message', messageData);
            setMessages((prev) => [
                ...prev,
                {
                    text: message,
                    username: user.name,
                    from: 'user',
                },
            ]);
            setMessage('');
        }
    };    const handleUserSubmit = (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        if (name && email) {
            setUser({ 
                name: name || "Customer", 
                email: email || "customer@example.com"
            });
        }
    };
    
    // Scroll to bottom of messages when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
                >
                    Chat with Support
                </button>
            ) : (
                <div className="bg-white rounded-lg shadow-xl w-80">
                    <div className="bg-blue-600 p-4 text-white rounded-t-lg flex justify-between">
                        <h3>Support Chat</h3>
                        <button onClick={() => setIsOpen(false)}>×</button>
                    </div>                    {!user && authChecked ? (
                        <div className="p-4">
                            <p className="text-center mb-3 text-gray-600">Please enter your details to start chatting</p>
                            <form onSubmit={handleUserSubmit}>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your Name"
                                    className="w-full p-2 border rounded mb-2"
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Your Email"
                                    className="w-full p-2 border rounded mb-2"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white p-2 rounded"
                                >
                                    Start Chat
                                </button>
                            </form>
                        </div>
                    ) : !authChecked ? (
                        <div className="p-4 flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="h-96 p-4 overflow-y-auto">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`mb-2 ${
                                            msg.from === 'user' ? 'text-right' : 'text-left'
                                        }`}
                                    >
                                        <div
                                            className={`flex flex-col ${
                                                msg.from === 'user' ? 'items-end' : 'items-start'
                                            }`}
                                        >
                                            <span className="text-xs text-gray-500 mb-1">
                                                {msg.username}
                                            </span>
                                            <span
                                                className={`inline-block p-2 rounded-lg ${
                                                    msg.from === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200'
                                                }`}
                                            >
                                                {msg.text}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={sendMessage} className="p-4 border-t">
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="flex-1 p-2 border rounded-l focus:outline-none"
                                        placeholder="Type a message..."
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 rounded-r"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;