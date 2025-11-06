
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { Message, ChatSession } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { C_TUTOR_SYSTEM_INSTRUCTION } from './constants';
import { ZapIcon, BookIcon, DocumentIcon } from './components/Icons';

const WelcomeScreen: React.FC<{ onSendMessage: (prompt: string) => void }> = ({ onSendMessage }) => (
    <div className="fade-in max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <span className="text-4xl font-bold text-white code-font">C</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to C Programming Tutor!</h2>
            <p className="text-slate-400 mb-6">Your expert AI assistant for mastering C programming from basics to advanced concepts.</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="glass px-4 py-2 rounded-full text-sm text-slate-300">📚 8 Authoritative Books</span>
                <span className="glass px-4 py-2 rounded-full text-sm text-slate-300">📋 All C Standards</span>
                <span className="glass px-4 py-2 rounded-full text-sm text-slate-300">💡 Practice Questions</span>
                <span className="glass px-4 py-2 rounded-full text-sm text-slate-300">🎯 Detailed Explanations</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <button onClick={() => onSendMessage("Explain how pointers work")} className="glass hover-lift p-4 rounded-xl text-left group">
                    <div className="text-sm font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">🔍 Explain how pointers work</div>
                    <div className="text-xs text-slate-500">Deep dive into memory management</div>
                </button>
                <button onClick={() => onSendMessage("Give me practice questions on structs")} className="glass hover-lift p-4 rounded-xl text-left group">
                    <div className="text-sm font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">📝 Give me practice questions</div>
                    <div className="text-xs text-slate-500">Test your knowledge with exercises</div>
                </button>
                <button onClick={() => onSendMessage("Explain the C compilation process")} className="glass hover-lift p-4 rounded-xl text-left group">
                    <div className="text-sm font-medium text-white mb-1 group-hover:text-pink-400 transition-colors">⚙️ Compilation process explained</div>
                    <div className="text-xs text-slate-500">From source to executable</div>
                </button>
                <button onClick={() => onSendMessage("What's new in C23?")} className="glass hover-lift p-4 rounded-xl text-left group">
                    <div className="text-sm font-medium text-white mb-1 group-hover:text-green-400 transition-colors">🎓 What's new in C23?</div>
                    <div className="text-xs text-slate-500">Latest C standard features</div>
                </button>
            </div>
        </div>
    </div>
);

const TypingIndicator: React.FC = () => (
    <div className="max-w-3xl mx-auto message-enter">
        <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-sm font-bold text-white code-font">C</span>
            </div>
            <div className="glass rounded-2xl px-5 py-3 shadow-lg">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                </div>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [allChats, setAllChats] = useState<Record<string, ChatSession>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const chatInstances = useRef<Record<string, Chat>>({});
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        try {
            const savedChats = localStorage.getItem('c-tutor-chats');
            const savedActiveId = localStorage.getItem('c-tutor-active-id');
            if (savedChats) {
                const chats = JSON.parse(savedChats);
                setAllChats(chats);
                if (savedActiveId && chats[savedActiveId]) {
                    setActiveChatId(savedActiveId);
                }
            }
        } catch (error) {
            console.error("Failed to load chats from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            if (Object.keys(allChats).length > 0) {
                localStorage.setItem('c-tutor-chats', JSON.stringify(allChats));
            }
            if (activeChatId) {
                localStorage.setItem('c-tutor-active-id', activeChatId);
            }
        } catch (error) {
            console.error("Failed to save chats to localStorage", error);
        }
    }, [allChats, activeChatId]);

    const getOrCreateChatInstance = useCallback((chatId: string) => {
        if (!chatInstances.current[chatId]) {
            if (!aiRef.current) throw new Error("AI not initialized");
            const history = allChats[chatId]?.messages.slice(0, -1) || []; // Exclude last model response for streaming
            chatInstances.current[chatId] = aiRef.current.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: C_TUTOR_SYSTEM_INSTRUCTION },
                history: history.map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }]
                }))
            });
        }
        return chatInstances.current[chatId];
    }, [allChats]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [activeChatId, allChats, isLoading]);

    const handleNewChat = () => {
        setActiveChatId(null);
    };

    const handleSelectChat = (chatId: string) => {
        setActiveChatId(chatId);
    };

    const generateTitleForChat = useCallback(async (chatId: string, userMessage: string, modelMessage: string) => {
        if (!aiRef.current) return;
        const prompt = `Based on the following user query and AI response, generate a short, descriptive title for this chat session (max 5 words).
        
        User: "${userMessage}"
        AI Response: "${modelMessage.substring(0, 200)}..."
        
        Title:`;
        
        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const title = response.text.trim().replace(/"/g, '');
            setAllChats(prev => ({
                ...prev,
                [chatId]: { ...prev[chatId], title }
            }));
        } catch (error) {
            console.error("Failed to generate title:", error);
        }
    }, []);

    const handleSendMessage = useCallback(async (userInput: string, image?: { data: string; mimeType: string }) => {
        if (!userInput.trim() || isLoading) return;

        setIsLoading(true);

        let currentChatId = activeChatId;
        let isNewChat = false;

        if (!currentChatId) {
            isNewChat = true;
            currentChatId = `chat_${Date.now()}`;
            const newChat: ChatSession = {
                id: currentChatId,
                title: "New Chat",
                messages: []
            };
            setAllChats(prev => ({ ...prev, [currentChatId!]: newChat }));
            setActiveChatId(currentChatId);
        }
        
        const userMessage: Message = { role: 'user', content: userInput };

        setAllChats(prev => ({
            ...prev,
            [currentChatId!]: {
                ...prev[currentChatId!],
                messages: [...prev[currentChatId!].messages, userMessage]
            }
        }));

        try {
            const chat = getOrCreateChatInstance(currentChatId);
            
            const parts: Part[] = [{ text: userInput }];
            if (image) {
                parts.unshift({
                    inlineData: {
                        mimeType: image.mimeType,
                        data: image.data.split(',')[1] // remove the data URI prefix
                    }
                });
            }

            // Fix: The `sendMessageStream` method expects an object with a `message` property.
            const stream = await chat.sendMessageStream({ message: parts });
            
            let modelResponse = '';
            setAllChats(prev => ({
                ...prev,
                [currentChatId!]: {
                    ...prev[currentChatId!],
                    messages: [...prev[currentChatId!].messages, { role: 'model', content: '' }]
                }
            }));

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setAllChats(prev => {
                    const currentMessages = [...prev[currentChatId!].messages];
                    currentMessages[currentMessages.length - 1] = { role: 'model', content: modelResponse };
                    return {
                        ...prev,
                        [currentChatId!]: { ...prev[currentChatId!], messages: currentMessages }
                    };
                });
            }

            if (isNewChat) {
                generateTitleForChat(currentChatId, userInput, modelResponse);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = { role: 'model', content: "An error occurred while fetching the response. Please try again." };
            setAllChats(prev => ({
                ...prev,
                [currentChatId!]: {
                    ...prev[currentChatId!],
                    messages: [...prev[currentChatId!].messages.slice(0, -1), errorMessage]
                }
            }));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, activeChatId, allChats, getOrCreateChatInstance, generateTitleForChat]);
    
    const activeMessages = activeChatId ? allChats[activeChatId]?.messages : [];

    return (
        <div className="flex h-screen max-w-full mx-auto font-sans text-slate-200 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 gradient-animate">
            <Sidebar 
                allChats={allChats}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
            />
            <div className="flex flex-col flex-1 h-screen">
            <header className="glass border-b border-white/10 backdrop-blur-xl z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-bold text-white code-font">C</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full pulse-glow"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">C Programming Tutor</h1>
                            <p className="text-sm text-slate-400">Expert AI Assistant • C89 to C23</p>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">8</div>
                            <div className="text-xs text-slate-400">Books</div>
                        </div>
                        <div className="w-px h-10 bg-slate-700"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">7</div>
                            <div className="text-xs text-slate-400">Standards</div>
                        </div>
                        <div className="w-px h-10 bg-slate-700"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-pink-400">∞</div>
                            <div className="text-xs text-slate-400">Questions</div>
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 flex overflow-hidden">
                 <aside className="hidden lg:block w-80 glass border-r border-white/10 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <ZapIcon className="w-5 h-5 text-blue-400" />
                                Quick Start
                            </h3>
                            <div className="space-y-2">
                                <button onClick={() => handleSendMessage("Explain Pointers")} className="w-full glass hover-lift p-3 rounded-lg text-left text-sm text-slate-300 hover:text-white transition-colors">
                                    <div className="font-medium">Explain Pointers</div>
                                    <div className="text-xs text-slate-500">Deep dive into memory</div>
                                </button>
                                <button onClick={() => handleSendMessage("Give me hard practice questions on arrays and strings")} className="w-full glass hover-lift p-3 rounded-lg text-left text-sm text-slate-300 hover:text-white transition-colors">
                                    <div className="font-medium">Practice Questions</div>
                                    <div className="text-xs text-slate-500">Arrays & Strings</div>
                                </button>
                                <button onClick={() => handleSendMessage("Explain the C compilation process")} className="w-full glass hover-lift p-3 rounded-lg text-left text-sm text-slate-300 hover:text-white transition-colors">
                                    <div className="font-medium">Compilation Process</div>
                                    <div className="text-xs text-slate-500">From code to executable</div>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <BookIcon className="w-5 h-5 text-purple-400" />
                                Topics
                            </h3>
                            <div className="space-y-2">
                                <div className="glass p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-300">Fundamentals</span>
                                        <span className="text-xs text-slate-500">15 lessons</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: '75%'}}></div></div>
                                </div>
                                <div className="glass p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-300">Pointers & Memory</span>
                                        <span className="text-xs text-slate-500">12 lessons</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: '45%'}}></div></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <DocumentIcon className="w-5 h-5 text-pink-400" />
                                Resources
                            </h3>
                            <div className="space-y-2 text-sm">
                                <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><span className="w-2 h-2 bg-blue-400 rounded-full"></span> C Standards Docs</a>
                                <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><span className="w-2 h-2 bg-purple-400 rounded-full"></span> Recommended Books</a>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div id="chat-container" className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {!activeChatId || activeMessages.length === 0 ? (
                            <WelcomeScreen onSendMessage={handleSendMessage} />
                        ) : (
                            activeMessages.map((msg, index) => (
                                <ChatMessage key={index} message={msg} />
                            ))
                        )}
                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-white/10 bg-slate-900/50 backdrop-blur-xl p-4">
                        <div className="max-w-3xl mx-auto">
                            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                        </div>
                    </div>
                </main>
            </div>
            </div>
        </div>
    );
};

export default App;
