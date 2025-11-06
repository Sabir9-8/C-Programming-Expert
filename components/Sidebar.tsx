import React from 'react';
import { ChatSession } from '../types';
import { PlusIcon, MessageSquareIcon, ChevronLeftIcon, MenuIcon, SettingsIcon } from './Icons';

interface SidebarProps {
    allChats: Record<string, ChatSession>;
    activeChatId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    allChats, 
    activeChatId, 
    onNewChat, 
    onSelectChat,
    isCollapsed,
    onToggleCollapse
}) => {
    
    const sortedChats = Object.values(allChats).sort((a, b) => {
        const lastMsgA = a.messages[a.messages.length - 1];
        const lastMsgB = b.messages[b.messages.length - 1];
        // A simple time comparison would be better, but we don't have timestamps.
        // Sorting by ID (which is based on Date.now()) serves as a proxy.
        return b.id.localeCompare(a.id);
    });

    const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';

    return (
        <div className={`flex flex-col bg-slate-900/70 backdrop-blur-lg border-r border-white/10 p-4 transition-all duration-300 ease-in-out ${sidebarWidth}`}>
            <div className="flex items-center justify-between mb-4">
                {!isCollapsed && <h2 className="text-xl font-bold text-white">History</h2>}
                <button onClick={onToggleCollapse} className="p-2 rounded-md hover:bg-slate-700 transition-colors">
                    {isCollapsed ? <MenuIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                </button>
            </div>

            <button 
                onClick={onNewChat}
                className="flex items-center justify-center sm:justify-start gap-3 w-full p-3 mb-4 text-sm font-semibold text-white bg-blue-600/50 hover:bg-blue-500/50 rounded-lg transition-colors"
            >
                <PlusIcon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>New Chat</span>}
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <h3 className="text-sm font-semibold text-slate-400 mb-2 px-2 flex items-center gap-2">
                    <MessageSquareIcon className="w-5 h-5" />
                   {!isCollapsed && 'Recents'}
                </h3>
                <nav className="flex flex-col gap-1">
                    {sortedChats.map(chat => (
                        <a
                            key={chat.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onSelectChat(chat.id); }}
                            className={`flex items-center gap-3 p-3 rounded-lg truncate text-sm transition-colors ${
                                activeChatId === chat.id 
                                ? 'bg-slate-700/80 text-white' 
                                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                            }`}
                        >
                            <MessageSquareIcon className={`w-5 h-5 flex-shrink-0 sm:hidden ${activeChatId === chat.id ? 'text-blue-400' : ''}`}/>
                            {!isCollapsed && <span className="truncate">{chat.title}</span>}
                        </a>
                    ))}
                </nav>
            </div>
            
            <div className="mt-4 border-t border-white/10 pt-4">
                 <button className="flex items-center justify-center sm:justify-start gap-3 w-full p-3 text-sm font-semibold text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors">
                    <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Settings</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;