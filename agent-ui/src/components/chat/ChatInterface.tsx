"use client"
import { useEffect, useState } from 'react';
import { useConfig } from '@/hooks/useConfig';

interface Message {
  id: string;
  type: string;
  content: string;
  sender: 'user' | 'agent';
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { config } = useConfig();

  useEffect(() => {
    const websocket = new WebSocket(`ws://${config.agentUrl}/ws/${Date.now()}`);
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        id: data.id,
        type: data.type,
        content: event.data,
        sender: 'agent',
      }]);

    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !ws) return;
    
    const message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
    };
    
    ws.send(JSON.stringify({
      type: 'message',
      content: input
    }));
    
    setMessages(prev => [...prev, message]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${
              message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded-lg p-2"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
