'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/utils/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const client = createBrowserClient();
        setSupabase(client);
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error || !session?.user) {
          router.push('/auth');
          return;
        }
        
        setUser(session.user);
        
        // Load conversation history
        const { data: history } = await client.from('chat_history')
          .select('*')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: true });
        
        if (history) {
          const formattedHistory: Message[] = history.map((item: any) => ({
            id: item.id,
            role: item.role as 'user' | 'assistant',
            content: item.content,
            timestamp: new Date(item.created_at),
          }));
          setMessages(formattedHistory);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth');
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !supabase) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save to database
      await supabase.from('chat_history').insert([
        {
          user_email: user.email,
          role: 'user',
          content: userMessage.content,
        },
        {
          user_email: user.email,
          role: 'assistant',
          content: assistantMessage.content,
        },
      ]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!supabase || !user) return;
    await supabase.from('chat_history').delete().eq('user_email', user.email);
    setMessages([]);
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by DeepSeek
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
            <p className="text-xs text-green-500">● Online</p>
          </div>
          <button
            onClick={clearChat}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
            title="Clear chat"
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white text-4xl">👋</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to AI Chat!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              I'm your AI assistant powered by DeepSeek. How can I help you today?
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="prose dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={sendMessage} className="flex space-x-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-6 py-4 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isTyping}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span className="mr-2">Send</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          AI can make mistakes. Please verify important information.
        </p>
      </footer>
    </div>
  );
}