'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/utils/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  timestamp: Date;
  thinkingProcess?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-chat');
  const [thinkingProcess, setThinkingProcess] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [parsedContent, setParsedContent] = useState<string>('');
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
        
        // Load conversations
        const { data: convs } = await client.from('conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false });
        
        if (convs) {
          setConversations(convs);
          if (convs.length > 0) {
            setCurrentConversation(convs[0]);
            // Load messages for current conversation
            const { data: msgs } = await client.from('messages')
              .select('*')
              .eq('conversation_id', convs[0].id)
              .order('created_at', { ascending: true });
            
            if (msgs) {
              const formattedMsgs: Message[] = msgs.map((item: any) => ({
                id: item.id,
                role: item.role as 'user' | 'assistant',
                content: item.content,
                timestamp: new Date(item.created_at),
              }));
              setMessages(formattedMsgs);
            }
          }
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

  // File upload and parsing functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;

    setUploadingFile(true);

    try {
      // Upload file to Supabase bucket
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName);

      // Call ZHIPU AI file parsing API
      const parseResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/files/parser', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ZHIPU_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: publicUrl,
          file_type: file.type,
        }),
      });

      if (!parseResponse.ok) {
        throw new Error(`ZHIPU AI parsing error: ${parseResponse.status}`);
      }

      const parseData = await parseResponse.json();
      
      // Wait for parsing to complete
      let taskId = parseData.task_id;
      let parsingResult;
      
      // Poll for parsing result
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const resultResponse = await fetch(
          `https://open.bigmodel.cn/api/paas/v4/files/parser/result/${taskId}/text`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ZHIPU_AI_API_KEY}`,
            },
          }
        );

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          if (resultData.status === 'succeeded') {
            parsingResult = resultData.content;
            break;
          } else if (resultData.status === 'failed') {
            throw new Error('File parsing failed');
          }
        }
      }

      if (parsingResult) {
        setParsedContent(parsingResult);
        
        // Add parsed content as a system message
        const parsedMessage: Message = {
          id: Date.now().toString() + '-parsed',
          role: 'system',
          content: `File content parsed:\n${parsingResult}`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, parsedMessage]);
        
        // Save to database
        if (currentConversation) {
          await supabase.from('messages').insert({
            conversation_id: currentConversation.id,
            role: 'system',
            content: `File content parsed from ${file.name}:\n${parsingResult}`,
          });
        }
      }

    } catch (error) {
      console.error('Error uploading or parsing file:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: `Error uploading or parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !supabase || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Create new conversation if none exists
      if (!currentConversation) {
        const { data: newConv } = await supabase.from('conversations').insert({
          user_id: user.id,
          user_email: user.email,
          title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
          model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL,
        }).select().single();
        
        if (newConv) {
          setCurrentConversation(newConv);
        }
      }

      // Prepare API request body
      const requestBody: any = {
        model: selectedModel,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: inputMessage },
        ],
        temperature: 0.7,
        stream: true,
      };

      // Add reasoning_effort for deepseek-reasoner when deep thinking is enabled
      if (selectedModel === 'deepseek-reasoner' && deepThinking) {
        requestBody.reasoning_effort = 'high';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Handle thinking process for deepseek-reasoner
              if (selectedModel === 'deepseek-reasoner' && parsed.choices[0]?.delta?.reasoning_content) {
                const thinkingContent = parsed.choices[0]?.delta?.reasoning_content || '';
                if (thinkingContent) {
                  setThinkingProcess(prev => prev + thinkingContent);
                  
                  // Create or update thinking message
                  const thinkingMessageId = assistantMessageId + '-thinking';
                  setMessages(prev => {
                    const hasThinking = prev.some(msg => msg.id === thinkingMessageId);
                    
                    if (!hasThinking) {
                      // Create new thinking message and insert before assistant message
                      const newThinkingMessage: Message = {
                        id: thinkingMessageId,
                        role: 'thinking',
                        content: 'Thinking process...',
                        timestamp: new Date(),
                        thinkingProcess: thinkingContent,
                      };
                      
                      const assistantIndex = prev.findIndex(msg => msg.id === assistantMessageId);
                      if (assistantIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages.splice(assistantIndex, 0, newThinkingMessage);
                        return newMessages;
                      } else {
                        // If assistant message isn't found yet, append to the end
                        return [...prev, newThinkingMessage];
                      }
                    } else {
                      // Update existing thinking message
                      return prev.map(msg => 
                        msg.id === thinkingMessageId 
                          ? { ...msg, thinkingProcess: (msg.thinkingProcess || '') + thinkingContent }
                          : msg
                      );
                    }
                  });
                }
              }
              
              // Handle regular content
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                
                // Update the assistant message content in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            } catch {
              // Ignore JSON parsing errors for incomplete chunks
            }
          }
        }
      }

      // Save messages to database after streaming is complete
      if (currentConversation) {
        const messagesToInsert: any[] = [
          {
            conversation_id: currentConversation.id,
            role: 'user',
            content: userMessage.content,
          },
          {
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: fullContent,
          },
        ];

        // Save thinking process if exists
        if (thinkingProcess) {
          messagesToInsert.push({
            conversation_id: currentConversation.id,
            role: 'system',
            content: `Thinking process: ${thinkingProcess}`,
          });
        }

        await supabase.from('messages').insert(messagesToInsert);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!supabase || !user || !currentConversation) return;
    await supabase.from('messages').delete().eq('conversation_id', currentConversation.id);
    setMessages([]);
  };

  const switchConversation = async (conversationId: string) => {
    if (!supabase || !user) return;
    
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    
    setCurrentConversation(conv);
    
    const { data: msgs } = await supabase.from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (msgs) {
      const formattedMsgs: Message[] = msgs.map((item: any) => {
        // Check if this is a thinking process message
        if (item.role === 'system' && item.content.startsWith('Thinking process: ')) {
          return {
            id: item.id + '-thinking',
            role: 'thinking' as const,
            content: 'Thinking process...',
            thinkingProcess: item.content.replace('Thinking process: ', ''),
            timestamp: new Date(item.created_at),
          };
        }
        
        return {
          id: item.id,
          role: item.role as 'user' | 'assistant' | 'system',
          content: item.content,
          timestamp: new Date(item.created_at),
        };
      });
      setMessages(formattedMsgs);
    }
  };

  const createNewConversation = async () => {
    if (!supabase || !user) return;
    
    const { data: newConv } = await supabase.from('conversations').insert({
      user_id: user.id,
      user_email: user.email,
      title: 'New Conversation',
      model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL,
    }).select().single();
    
    if (newConv) {
      setCurrentConversation(newConv);
      setConversations(prev => [newConv, ...prev]);
      setMessages([]);
    }
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createNewConversation}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Recent Conversations
          </div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => switchConversation(conv.id)}
              className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                currentConversation?.id === conv.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium truncate">{conv.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(conv.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">{user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
              <p className="text-xs text-green-500">● Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chat</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentConversation ? currentConversation.title : 'Select a conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Deep Thinking Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Deep Thinking</span>
              <button
                onClick={() => setDeepThinking(!deepThinking)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  deepThinking ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                title={deepThinking ? 'Disable deep thinking' : 'Enable deep thinking'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    deepThinking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Model Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="deepseek-reasoner">DeepSeek Reasoner</option>
              </select>
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
            messages.map((message) => {
              // Special handling for thinking messages
              if (message.role === 'thinking') {
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">💭</span>
                        </div>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Thinking Process
                        </span>
                      </div>
                      <div className="prose dark:prose-invert max-w-none text-amber-700 dark:text-amber-400">
                        {message.thinkingProcess ? (
                          message.thinkingProcess.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                              {line}
                            </p>
                          ))
                        ) : (
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-2 text-amber-600 dark:text-amber-500">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              }

              // Regular message handling
              return (
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
              );
            })
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
    </div>
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
