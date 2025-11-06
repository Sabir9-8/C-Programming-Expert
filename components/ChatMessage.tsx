import React, { useMemo, useState } from 'react';
import { Message } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="code-block my-4">
            <div className="bg-slate-800 text-slate-400 px-4 py-2 text-sm flex justify-between items-center rounded-t-lg -mx-4 -mt-4 mb-4">
                <span>C Code</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-200 transition-colors"
                    aria-label={isCopied ? "Copied" : "Copy code"}
                >
                    {isCopied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="text-sm overflow-x-auto custom-scrollbar"><code className="language-c code-font">{code}</code></pre>
        </div>
    );
};

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
    const formattedHtml = useMemo(() => {
        let processedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-cyan-400 rounded-md px-1 py-0.5 code-font text-sm">$1</code>');
        
        return processedText.split('\n').map((line, i) => {
             if (line.trim().match(/^(\d+\.|[*-])\s/)) { // Matches ordered and unordered lists
                return <p key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line }} />;
            }
            if (line.trim() === '---') {
                return <hr key={i} className="border-slate-700 my-4" />;
            }
            // Add a margin-bottom to paragraphs for spacing
            return <p key={i} className="mb-4 last:mb-0" dangerouslySetInnerHTML={{ __html: line }} />;
        });
    }, [text]);

    return <>{formattedHtml}</>;
};

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isModel = message.role === 'model';

    // Render nothing for empty, streaming messages. Loading is handled by App.tsx
    if (message.content.trim() === '') return null;
    
    const contentParts = useMemo(() => {
        return message.content.split(/(```c[\s\S]*?```)/g).filter(Boolean);
    }, [message.content]);
    
    if (!isModel) {
        return (
            <div className="max-w-3xl mx-auto message-enter">
                <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl rounded-tr-sm px-5 py-3 max-w-lg shadow-lg">
                        <p className="text-white whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-3xl mx-auto message-enter">
            <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg mt-1">
                    <span className="text-sm font-bold text-white code-font">C</span>
                </div>
                <div className="flex-1 glass rounded-2xl rounded-tl-sm p-5 shadow-lg min-w-0">
                    <div className="text-slate-300">
                        {contentParts.map((part, index) => {
                            if (part.startsWith('```c')) {
                                const code = part.replace(/^```c\n?|```$/g, '');
                                return <CodeBlock key={index} code={code} />;
                            }
                            return <MarkdownText key={index} text={part} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
