export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSING = 'processing'
}

export interface UsedTool {
  name: string;
  query: string;
  tool_call_id: string;
  content: string;
  role: string;
}

export interface ErrorResult {
  _id: string;
  error: string;
  query?: string;
}

export interface Question {
  question_title: string;
  answer: string;
  query: string;
  used_tools: UsedTool[];
  _id: string;
  updated_at: string;
  created_at: string;
  task_type: 'general_question';
  status: TaskStatus;
}

export interface Hypothesis {
  hypothesis_name: string;
  hypothesis_main_idea: string;
  research_summary: string;
  short_summary: string;
  support_strength: string;
  used_tools: UsedTool[];
  query?: string;
  datasourceIds?: string[];
  status?: TaskStatus;
  task_type: 'hypothesis';
  updated_at: string;
  created_at: string;

}
