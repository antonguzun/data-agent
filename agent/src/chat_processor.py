from datetime import datetime
import enum
import uuid
from typing import Literal, Union, List

import pydantic

from schemes.question import QuestionOutputScheme


class OpenAIMessage(pydantic.BaseModel):
    role: str
    content: str


class EventTypesEnum(enum.StrEnum):
    MESSAGE = "message"
    SYSTEM = "system"
    USER = "user"
    LOG = "log"
    PROMPT = "prompt"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"


class BaseEvent(pydantic.BaseModel):
    id: str
    type: EventTypesEnum
    timestamp: datetime  # Changed from str to datetime


class MessageEvent(BaseEvent):
    type: Literal[EventTypesEnum.MESSAGE] = EventTypesEnum.MESSAGE
    message: OpenAIMessage | QuestionOutputScheme


class SystemEvent(BaseEvent):
    type: Literal[EventTypesEnum.SYSTEM] = EventTypesEnum.SYSTEM
    message: OpenAIMessage


class UserEvent(BaseEvent):
    type: Literal[EventTypesEnum.USER] = EventTypesEnum.USER
    message: str
    datasoruceIds: List[str]


class LogEvent(BaseEvent):
    type: Literal[EventTypesEnum.LOG] = EventTypesEnum.LOG
    message: str


class PromptEvent(BaseEvent):
    type: Literal[EventTypesEnum.PROMPT] = EventTypesEnum.PROMPT
    message: str


class ToolCallEvent(BaseEvent):
    type: Literal[EventTypesEnum.TOOL_CALL] = EventTypesEnum.TOOL_CALL
    tool_call_id: str
    tool_name: str
    parameters: dict[str, str]


class ToolResultEvent(BaseEvent):
    type: Literal[EventTypesEnum.TOOL_RESULT] = EventTypesEnum.TOOL_RESULT
    tool_call_id: str
    tool_name: str
    output: str


EventTypes = Union[
    MessageEvent,
    SystemEvent,
    UserEvent,
    LogEvent,
    PromptEvent,
    ToolCallEvent,
    ToolResultEvent,
]


class Conversation(pydantic.BaseModel):
    id: str
    started_at: datetime
    events: List[EventTypes]

    @classmethod
    def create(cls, db, conversation_id: str):
        conversation = db.conversations.find_one({"_id": conversation_id})
        if not conversation:
            db.conversations.insert_one(
                {
                    "_id": conversation_id,
                    "created_at": datetime.utcnow(),
                    "events": [],
                }
            )

        conversation = cls(id=conversation_id, started_at=datetime.utcnow(), events=[])
        return conversation

    def _push_event(self, db, event: EventTypes):
        self.events.append(event)
        db.conversations.update_one(
            {"_id": self.id},
            {"$push": {"events": event.model_dump()}},
        )

    def add_user_message(self, db, data: dict[str, str | list[str]]) -> UserEvent:
        event = UserEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            message=data["content"],
            datasoruceIds=data["datasourceIds"],
        )
        self._push_event(db, event)
        return event

    def add_prompt_message(self, db, message: dict) -> UserEvent:
        event = PromptEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            message=message["content"],
        )
        self._push_event(db, event)
        return event

    def add_message(self, db, message: OpenAIMessage) -> UserEvent:
        event = MessageEvent(
            id=str(uuid.uuid4()), timestamp=datetime.utcnow(), message=message
        )
        self._push_event(db, event)
        return event

    def add_tool_call(
        self, db, tool_call_id: str, tool_name: str, parameters: dict[str, str]
    ) -> UserEvent:
        event = ToolCallEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            parameters=parameters,
        )
        self._push_event(db, event)
        return event

    def add_tool_call_result(
        self, db, tool_call_id: str, tool_name: str, output: str
    ) -> UserEvent:
        event = ToolResultEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            output=output,
        )
        self._push_event(db, event)
        return event

    def remove_events_after(self, db, event_id):
        """Remove all events after the specified event ID"""
        # Find the event in the current events list
        event_index = next((i for i, e in enumerate(self.events) if e.id == event_id), -1)
        if event_index == -1:
            return

        # Remove events after this index from the list
        self.events = self.events[:event_index + 1]
        
        # Update the database
        db.conversations.update_one(
            {"_id": self.id},
            {"$set": {"events": [e.model_dump() for e in self.events]}}
        )

    def update_tool_call_query(self, db, event_id, new_query):
        """Update the SQL query in a tool call event"""
        # Update in memory
        event = next((e for e in self.events if e.id == event_id), None)
        if event and isinstance(event, ToolCallEvent):
            event.parameters["query"] = new_query
        
        # Update in database
        db.conversations.update_one(
            {"_id": self.id},
            {"$set": {"events": [e.model_dump() for e in self.events]}}
        )

    def get_last_user_message(self, db):
        """Get the last user message from the conversation"""
        for event in reversed(self.events):
            if isinstance(event, UserEvent):
                return event
        return None
