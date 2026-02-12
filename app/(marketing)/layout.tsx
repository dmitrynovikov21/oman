'use client';

import { LanguageProvider } from '@/lib/i18n/context';
import { ChatProvider } from '@/lib/chat/chat-context';
import ChatWidget from '@/components/chat/chat-widget';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <LanguageProvider>
      <ChatProvider>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <ChatWidget />
      </ChatProvider>
    </LanguageProvider>
  );
}

