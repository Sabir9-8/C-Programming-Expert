import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, AttachmentIcon, XCircleIcon } from './Icons';

interface ChatInputProps {
    onSendMessage: (input: string, image?: { data: string; mimeType: string }) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${Math.min(scrollHeight, 128)}px`;
        }
    }, [input]);

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((input.trim() || imageFile) && !isLoading) {
            if (imageFile && imagePreview) {
                onSendMessage(input, { data: imagePreview, mimeType: imageFile.type });
            } else {
                onSendMessage(input);
            }
            setInput('');
            handleRemoveImage();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                alert("File is too large. Please select an image under 4MB.");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-2 flex flex-col">
                {imagePreview && (
                    <div className="relative self-start m-2">
                        <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                        <button 
                            type="button" 
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
                            aria-label="Remove image"
                        >
                            <XCircleIcon className="w-6 h-6"/>
                        </button>
                    </div>
                )}
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about C programming..."
                        className="flex-1 bg-transparent text-white placeholder-slate-500 px-4 py-3 resize-none focus:outline-none max-h-32 custom-scrollbar"
                        rows={1}
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            className="hidden" 
                        />
                        <button type="button" onClick={handleAttachmentClick} className="glass hover-lift p-3 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Attach file">
                            <AttachmentIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !imageFile)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover-lift p-3 rounded-xl text-white shadow-lg transition-all duration-200 disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </form>
            <div className="flex justify-between items-center mt-2 px-2">
                <p className="text-xs text-slate-500">Press Enter to send, Shift+Enter for new line</p>
                <p className="text-xs text-slate-500">Powered by Gemini</p>
            </div>
        </>
    );
};

export default ChatInput;