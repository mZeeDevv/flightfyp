import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null); // Store user info (name and email)
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io('http://localhost:4000', {
            transports: ['websocket', 'polling'],
        });
        setSocket(newSocket);

        return () => newSocket.close();
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
    };

    const handleUserSubmit = (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        if (name && email) {
            setUser({ name, email });
        }
    };

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
                    </div>
                    {!user ? (
                        <div className="p-4">
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