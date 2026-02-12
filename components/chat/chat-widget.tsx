'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChat } from '@/lib/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';

// ---------------------
// Quick Reply Data
// ---------------------
const QUICK_REPLIES = [
    { en: 'What is Tilqai?', ar: 'ما هي Tilqai؟' },
    { en: 'Calculate ROI', ar: 'حساب العائد على الاستثمار' },
    { en: 'Schedule a call', ar: 'حجز مكالمة' },
    { en: 'Send inquiry', ar: 'إرسال استفسار' },
];

// ---------------------
// Typing Indicator
// ---------------------
function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center shrink-0">
                <span className="text-[10px]">🤖</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}

// ---------------------
// Message Bubble
// ---------------------
function MessageBubble({ role, content }: { role: string; content: string }) {
    const isUser = role === 'user';

    return (
        <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">🤖</span>
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? 'bg-[#0066FF] text-white rounded-br-md'
                        : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-md'
                    }`}
            >
                {content}
            </div>
        </div>
    );
}

// ---------------------
// Main Widget
// ---------------------
export default function ChatWidget() {
    const { messages, isOpen, isLoading, showQuickReplies, setIsOpen, setShowQuickReplies, sendMessage } = useChat();
    const { lang } = useLanguage();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isRTL = lang === 'ar';

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input.trim());
        setInput('');
        // Reset textarea height
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickReply = (text: string) => {
        sendMessage(text);
    };

    const welcomeMsg = isRTL
        ? 'مرحباً! 👋 أنا مساعد Tilqai. كيف يمكنني مساعدتك اليوم؟'
        : 'Hi there! 👋 I\'m the Tilqai Assistant. How can I help you today?';

    return (
        <>
            {/* Chat Panel */}
            <div
                className={`fixed z-50 transition-all duration-300 ease-out ${isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    } ${
                    // Mobile: full-width bottom sheet
                    'bottom-0 left-0 right-0 h-[85vh] md:bottom-24 md:h-auto md:left-auto md:right-6 md:w-[400px] md:max-h-[550px] md:rounded-2xl'
                    }`}
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
                <div className="flex flex-col h-full md:h-[550px] bg-[#0a0e1a]/95 backdrop-blur-xl border border-white/10 md:rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-[#0a1a3a]/80 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center">
                                    <span className="text-sm">🤖</span>
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a1a3a]" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Tilqai Assistant</p>
                                <p className="text-white/40 text-xs">{isRTL ? 'متصل الآن' : 'Online now'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <MessageBubble role="assistant" content={welcomeMsg} />
                        )}

                        {messages.map((msg, i) => (
                            <MessageBubble key={i} role={msg.role} content={msg.content} />
                        ))}

                        {isLoading && <TypingIndicator />}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="px-4">
                        {/* Toggle Button */}
                        <button
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                            className="flex items-center gap-1.5 text-white/30 hover:text-white/50 text-[11px] mb-2 transition-colors"
                        >
                            <svg
                                className={`w-3 h-3 transition-transform ${showQuickReplies ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            {isRTL ? (showQuickReplies ? 'إخفاء الاقتراحات' : 'إظهار الاقتراحات') : (showQuickReplies ? 'Hide suggestions' : 'Show suggestions')}
                        </button>

                        {/* Chips */}
                        <div
                            className={`flex flex-wrap gap-2 transition-all duration-200 ${showQuickReplies ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0 overflow-hidden mb-0'
                                }`}
                        >
                            {QUICK_REPLIES.map((qr, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickReply(isRTL ? qr.ar : qr.en)}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 text-xs text-white/70 bg-white/5 border border-[#0066FF]/20 rounded-full hover:bg-[#0066FF]/15 hover:border-[#0066FF]/40 hover:text-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isRTL ? qr.ar : qr.en}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="px-4 pb-4 pt-2 border-t border-white/5">
                        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#0066FF]/40 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    // Auto-resize
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type a message...'}
                                rows={1}
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none max-h-[100px]"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-8 h-8 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                            >
                                <svg
                                    className={`w-4 h-4 text-white ${isRTL ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 bottom-6 right-6 w-14 h-14 rounded-full bg-[#0066FF] hover:bg-[#0052CC] shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                    }`}
            >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.97-4.03 9-9 9a9.065 9.065 0 01-4.244-1.052L3 21l1.052-4.756A9.065 9.065 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
                    />
                </svg>
            </button>
        </>
    );
}
