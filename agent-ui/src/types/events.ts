import { ReactNode } from 'react';

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
}

export interface QuestionOutput {
  chain_of_thoughts?: string;
  question_title: string;
  answer: string;
}

export interface MessageEvent extends BaseEvent {
  type: 'message';
  message: {
    role: string;
    content: string;
  };
}

export interface PromptEvent extends BaseEvent {
  type: 'prompt';
  message: string;
}

export interface LogEvent extends BaseEvent {
  type: 'log';
  message: string;
}

export interface ToolCallEvent extends BaseEvent {
  type: 'tool_call';
  tool_call_id: string;
  tool_name: string;
  parameters: Record<string, string>;
}

export interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';
  tool_call_id: string;
  tool_name: string;
  output: string;
}

export interface UserEvent extends BaseEvent {
  type: 'user';
  message: string;
}


export type Event = MessageEvent | PromptEvent | LogEvent | ToolCallEvent | ToolResultEvent | UserEvent;

export interface ExpandableProps {
  title: string | ReactNode;
  children: ReactNode;
}
