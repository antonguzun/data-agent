import 'highlight.js/styles/github-dark.css';
import { Event, ToolResultEvent } from '../../types/events';
import { MessageRenderer } from './renderers/MessageRenderer';
import { ToolCallRenderer } from './renderers/ToolCallRenderer';
import { Expandable } from './components/Expandable';

interface EventRendererProps {
  event: Event;
  matchingToolResult?: ToolResultEvent;
  ws: WebSocket;
}

export function EventRenderer({ event, matchingToolResult, ws }: EventRendererProps) {
  switch (event.type) {
    case 'message':
      return <MessageRenderer event={event} />;

    case 'prompt':
      return (
        <div className="text-gray-300">
          <Expandable title={<span className="font-semibold">System Prompt</span>}>
            <div className="text-gray-400 text-sm">
              {event.message}
            </div>
          </Expandable>
        </div>
      );

    case 'log':
      return (
        <div className="text-blue-300">
          <span className="font-bold text-blue-200">Info: </span>
          {event.message}
        </div>
      );

    case 'tool_call':
      return <ToolCallRenderer event={event} matchingToolResult={matchingToolResult} ws={ws} />;

    default:
      return null;
  }
}
