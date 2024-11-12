"use client"
import { useEffect, useState, useRef } from 'react';
import { useConfig } from '@/hooks/useConfig';
const STORAGE_KEY = 'selectedDatasources';
import { EventRenderer } from './EventRenderer';
import { useDataSources } from '@/hooks/useDataSources';
import { DataSourceSelector } from './DataSourceSelector';
import { message } from 'antd';
import type { Event, MessageEvent, ToolResultEvent } from '@/types/events';

export default function ChatInterface() {
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatasources, setSelectedDatasources] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedDatasources(JSON.parse(saved));
    }
  }, []);
  const [isDataSourceSelectorOpen, setIsDataSourceSelectorOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { config } = useConfig();
  const { dataSources } = useDataSources();

  // Save selections when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedDatasources));
  }, [selectedDatasources]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  useEffect(() => {
    const websocket = new WebSocket(`ws://${config.agentUrl}/ws/${Date.now()}`);
    
    websocket.onopen = () => {
      console.log('WebSocket Connected');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [...prev, data]);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, [config.agentUrl]);

  const sendMessage = () => {
    if (!input.trim() || !ws) return;
    
    if (!selectedDatasources.length) {
      message.warning('Please select at least one data source before sending a message');
      setIsDataSourceSelectorOpen(true);
      return;
    }
    
    const msg: MessageEvent = {
      id: Date.now().toString(),
      type: 'message',
      timestamp: new Date().toISOString(),
      message: {
        role: 'user',
        content: input
      }
    };
    
    ws.send(JSON.stringify({
      type: 'message',
      content: input,
      datasourceIds: selectedDatasources
    }));
    
    setEvents(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden absolute inset-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
        <div id='chat-messages' className="max-w-4xl mx-auto space-y-4 px-4 w-full">
          {events.map((event, index) => {
            if (event.type === 'message' && event.message.role === 'user') return null;
            
            let matchingToolResult;
            if (event.type === 'tool_call') {
              matchingToolResult = events.find(
                e => e.type === 'tool_result' && e.tool_call_id === event.tool_call_id
              ) as ToolResultEvent | undefined;
            }

            return (
              <div key={event.id} className="text-left">
                {ws && (
                  <EventRenderer 
                    event={event}
                    matchingToolResult={matchingToolResult}
                    ws={ws}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div id='chat-input' className="border-t bg-white p-4 shadow-lg sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col gap-3">
            <div className="datasource-selector">
              <DataSourceSelector 
                selectedDatasources={selectedDatasources}
                onChange={setSelectedDatasources}
                isOpen={isDataSourceSelectorOpen}
                setIsOpen={setIsDataSourceSelectorOpen}
              />
            </div>
            <div className="flex gap-3 items-center">
              <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border-2 border-gray-200 rounded-full px-6 p-3 text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
