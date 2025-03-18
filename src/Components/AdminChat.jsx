import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const AdminChat = () => {
    const [message, setMessage] = useState('');
    const [activeChats, setActiveChats] = useState(new Map());
    const [selectedChat, setSelectedChat] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:4000', {
            transports: ['websocket', 'polling'],
        });
        newSocket.emit('admin-connect');
        setSocket(newSocket);

        // Listen for existing chats
        newSocket.on('existing-chats', (chats) => {
            const chatMap = new Map();
            chats.forEach((chat) => chatMap.set(`${chat.username}-${chat.email}`, chat));
            setActiveChats(chatMap);
        });

        // Listen for new user messages
        newSocket.on('user-message', (messageData) => {
            setActiveChats((prev) => {
                const newChats = new Map(prev);
                const userKey = `${messageData.username}-${messageData.email}`;
                
                if (!newChats.has(userKey)) {
                    newChats.set(userKey, {
                        username: messageData.username,
                        email: messageData.email,
                        messages: [],
                    });
                }
                
                const chat = newChats.get(userKey);
                // Check if message already exists to prevent duplicates
                const messageExists = chat.messages.some(
                    msg => msg.text === messageData.text && 
                          msg.timestamp === messageData.timestamp
                );
                
                if (!messageExists) {
                    chat.messages.push({
                        text: messageData.text,
                        username: messageData.username,
                        from: 'user',
                        timestamp: messageData.timestamp
                    });
                }
                
                return newChats;
            });
        });

        return () => {
            newSocket.off('user-message');
            newSocket.close();
        };
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && socket && selectedChat) {
            const timestamp = new Date().toISOString();
            // Emit the message to the server
            socket.emit('admin-message', {
                text: message,
                userKey: selectedChat,
                username: 'Support Jeetseeker',
                timestamp
            });

            // Update the local state immediately (optimistic update)
            setActiveChats((prev) => {
                const newChats = new Map(prev);
                const chat = newChats.get(selectedChat);
                chat.messages.push({
                    text: message,
                    username: 'Support Jeetseeker',
                    from: 'admin',
                    timestamp
                });
                return newChats;
            });

            setMessage('');
        }
    };

    return (
        <div className="flex h-screen bg-white">
            {/* Chat list sidebar */}
            <div className="w-1/4 border-r p-4 bg-gray-50">
                <h2 className="text-xl font-bold mb-4">Active Chats</h2>
                {Array.from(activeChats.values()).map((chat) => {
                    const userKey = `${chat.username}-${chat.email}`;
                    return (
                        <div
                            key={userKey}
                            onClick={() => setSelectedChat(userKey)}
                            className={`p-3 cursor-pointer rounded-lg ${
                                selectedChat === userKey ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            <p className="font-medium">{chat.username}</p>
                        </div>
                    );
                })}
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-4 bg-white flex flex-col">
                {selectedChat ? (
                    <>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {activeChats.get(selectedChat)?.messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`mb-4 ${
                                        msg.from === 'admin' ? 'text-right' : 'text-left'
                                    }`}
                                >
                                    <div
                                        className={`inline-block max-w-[70%] p-3 rounded-lg ${
                                            msg.from === 'admin'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                        <span className="text-xs text-gray-400 block mt-1">
                                            {msg.from === 'admin' ? 'You' : msg.username}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendMessage} className="border-t pt-4">
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
                                    className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;