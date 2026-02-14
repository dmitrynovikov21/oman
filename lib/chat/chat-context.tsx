'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';

// ---------------------
// Types
// ---------------------
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

interface ChatContextType {
    messages: ChatMessage[];
    isOpen: boolean;
    isLoading: boolean;
    showQuickReplies: boolean;
    setIsOpen: (open: boolean) => void;
    setShowQuickReplies: (show: boolean) => void;
    sendMessage: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

// ---------------------
// Session ID (persisted in sessionStorage)
// ---------------------
function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('tilqai_chat_sid');
    if (!sid) {
        try {
            sid = crypto.randomUUID();
        } catch {
            sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
            });
        }
        sessionStorage.setItem('tilqai_chat_sid', sid);
    }
    return sid;
}

// ---------------------
// Provider
// ---------------------
export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const historyLoaded = useRef(false);

    // Load history on mount
    useEffect(() => {
        if (historyLoaded.current) return;
        historyLoaded.current = true;

        const sid = getSessionId();
        if (!sid) return;

        // Try sessionStorage first (instant)
        const cached = sessionStorage.getItem('tilqai_chat_msgs');
        if (cached) {
            try {
                setMessages(JSON.parse(cached));
            } catch { /* ignore */ }
        }

        // Then fetch from DB (authoritative)
        fetch(`/api/chat/history?sessionId=${sid}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.messages?.length) {
                    setMessages(data.messages);
                    sessionStorage.setItem(
                        'tilqai_chat_msgs',
                        JSON.stringify(data.messages)
                    );
                }
            })
            .catch(() => { /* silent fail */ });
    }, []);

    // Sync messages to sessionStorage
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('tilqai_chat_msgs', JSON.stringify(messages));
        }
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: getSessionId(),
                    message: trimmed,
                }),
            });

            const data = await res.json();

            if (data.reply) {
                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: data.reply,
                };
                setMessages((prev) => [...prev, assistantMsg]);
            } else if (data.error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: 'Sorry, something went wrong. Please try again.',
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Connection error. Please check your internet and try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    return (
        <ChatContext.Provider
            value={{
                messages,
                isOpen,
                isLoading,
                showQuickReplies,
                setIsOpen,
                setShowQuickReplies,
                sendMessage,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
}
