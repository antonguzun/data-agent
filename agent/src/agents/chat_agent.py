from datetime import datetime
import json
import logging
from typing import Any, Dict, Generator, List

from bson import ObjectId
from openai import OpenAI
from pymongo.database import Database

from chat_processor import Conversation
from config import OPENAI_CONFIG, SYSTEM_PROMPT, MAX_TOOL_CALLS
from models.datasource import DataSource, create_datasource
from schemes.question import QUESTION_OUTPUT_SCHEME
from tools import tools


class ChatOpenAIDatasourceAgent:
    """
    Agent allowed to use tools.
    Provides datasource context in prompt.

    response_format defines the logic
    """

    response_format = QUESTION_OUTPUT_SCHEME

    def __init__(self, mongodb: Database, conversation: Conversation):
        self.mongodb = mongodb
        self.client = OpenAI()
        self.conversation = conversation

    def _get_datasources(self, datasource_ids: List[str]) -> List[DataSource]:
        """Fetch and prepare datasources for the hypothesis"""
        datasources = []
        for ds_id in datasource_ids:
            datasource_raw = self.mongodb.datasources.find_one({"_id": ObjectId(ds_id)})
            if datasource_raw:
                datasource = create_datasource(datasource_raw)
                context = self.mongodb["datasource-contexts"].find_one(
                    {"_id": ObjectId(ds_id)}
                )
                datasource.meta = context if context else {}
                datasources.append(datasource)
        return datasources

    def _prepare_messages(
        self, question: Dict, datasources: List[DataSource]
    ) -> List[Dict]:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ]

        if datasources:
            datasources_explanation = "You have the following datasources:\n"
            datasources_explanation += "\n".join(
                ds.context_prompt() for ds in datasources
            )
            messages.append({"role": "system", "content": datasources_explanation})

        return messages

    def process(self, question) -> Generator[Any, Any, Any]:
        """Process a single hypothesis using OpenAI and return the results"""
        datasources = self._get_datasources(["671f7e3609fd32f8216e06c6"])
        messages = self._prepare_messages(question, datasources)
        for message in messages:
            event = self.conversation.add_message(self.mongodb, message)
            yield event

        used_tools = []

        response = self.client.chat.completions.create(
            messages=messages,
            response_format=self.response_format,
            tools=tools.TOOLS,  # TODO! define in function to allow for customization
            **OPENAI_CONFIG,
        )

        tool_calls_count = 0
        while response.choices[0].message.tool_calls:
            logging.info("Processing tool calls...")
            if tool_calls_count >= MAX_TOOL_CALLS:
                logging.error("Too many function calls")
                raise Exception("Too many function calls")

            for event in tools.handle_tools2(
                response,
                messages,
                datasources,
                conversation=self.conversation,
                mongodb=self.mongodb,
            ):
                yield event

            response = self.client.chat.completions.create(
                messages=messages,
                response_format=self.response_format,
                tools=tools.TOOLS,
                **OPENAI_CONFIG,
            )
            tool_calls_count += 1

        try:
            result = json.loads(response.choices[0].message.content)
            result["used_tools"] = used_tools
            result["updated_at"] = datetime.utcnow()
        except Exception as e:
            logging.error(f"Error processing hypothesis: {e}")
            raise
