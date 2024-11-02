from enum import Enum
from typing import Dict

class HypothesisStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

OPENAI_CONFIG: Dict = {
    "model": "gpt-4o-mini",
    "temperature": 1,
    "max_tokens": 2048,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "parallel_tool_calls": True,
}

SYSTEM_PROMPT = """You are a professional data analyst. Use the supplied tools to assist the user. 
You are allowed to use tools for researching datasource more precisely if consider that's important."""

MAX_TOOL_CALLS = 5
MONITOR_SLEEP_TIME = 1
