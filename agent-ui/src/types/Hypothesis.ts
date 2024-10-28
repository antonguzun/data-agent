export enum HypothesisStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface UsedTool {
  name: string;
  query: string;
  tool_call_id: string;
  content: string;
  role: string;
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
  status?: HypothesisStatus;
}