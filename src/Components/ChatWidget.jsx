import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null); // Store user info (name and email)
    const [authChecked, setAuthChecked] = useState(false); // Flag to check if auth has been checked
    const [chatMode, setChatMode] = useState(null); // 'ai' or 'admin'
    const [isProcessing, setIsProcessing] = useState(false); // For AI response processing
    const [genAI, setGenAI] = useState(null);
    const [aiModel, setAiModel] = useState(null);
    const messagesEndRef = useRef(null);
    
    // Initialize Gemini AI
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
        
        if (apiKey) {
            const ai = new GoogleGenerativeAI(apiKey);
            setGenAI(ai);
            setAiModel(ai.getGenerativeModel({ model: modelName }));
        } else {
            console.error("Gemini API key not found in environment variables");
        }
    }, []);
    
    useEffect(() => {
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
    }, [socket]);    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !user) return;
        
        // Add user message to chat
        setMessages((prev) => [
            ...prev,
            {
                text: message,
                username: user.name,
                from: 'user',
            },
        ]);
        
        const userMessage = message;
        setMessage('');
          if (chatMode === 'admin') {
            // Send to admin via socket
            if (socket) {
                const messageData = {
                    text: userMessage,
                    username: user.name,
                    email: user.email,
                    userId: user.email, // Adding userId to ensure admin panel can identify the user properly
                };
                socket.emit('user-message', messageData);
            }
        } else if (chatMode === 'ai' && aiModel) {
            // Process with Gemini AI
            setIsProcessing(true);
            try {
                const result = await aiModel.generateContent(userMessage);
                const response = result.response;
                const text = response.text();
                
                // Format the response to handle markdown properly
                // Replace ** with proper format and handle newlines
                const formattedText = text
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
                    .replace(/\\n/g, '\n') // Handle escaped newlines
                    .trim();
                
                setMessages((prev) => [
                    ...prev,
                    {
                        text: formattedText,
                        username: 'AI Assistant',
                        from: 'ai',
                    },
                ]);
            } catch (error) {
                console.error("Error generating AI response:", error);
                setMessages((prev) => [
                    ...prev,
                    {
                        text: "Sorry, I couldn't generate a response. Please try again later.",
                        username: 'AI Assistant',
                        from: 'ai',
                    },
                ]);
            } finally {
                setIsProcessing(false);
            }
        }
    };const handleUserSubmit = (e) => {
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
                        </div>                    ) : !authChecked ? (
                        <div className="p-4 flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : chatMode === null ? (
                        <div className="p-4">
                            <p className="text-center mb-4 text-gray-600">Choose who you want to chat with:</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setChatMode('ai')}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                >
                                    Chat with AI
                                </button>
                                <button
                                    onClick={() => setChatMode('admin')}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                >
                                    Chat with Admin
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                                <span className="font-medium">{chatMode === 'ai' ? 'AI Assistant' : 'Admin Support'}</span>
                                <button 
                                    onClick={() => {
                                        setChatMode(null);
                                        setMessages([]);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Change
                                </button>
                            </div>
                            <div className="h-80 p-4 overflow-y-auto">
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