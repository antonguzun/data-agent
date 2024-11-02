from datetime import datetime
import json
import logging
from typing import Dict, List

from bson import ObjectId
from openai import OpenAI
from pymongo.database import Database

from config import OPENAI_CONFIG, SYSTEM_PROMPT, MAX_TOOL_CALLS
from models.datasource import DataSource, create_datasource
from schemes.hypothesis import SUMMARY_OUTPUT_SCHEME
from tools import tools

class HypothesisProcessor:
    def __init__(self, mongodb: Database):
        self.mongodb = mongodb
        self.client = OpenAI()
        
    def _get_datasources(self, datasource_ids: List[str]) -> List[DataSource]:
        """Fetch and prepare datasources for the hypothesis"""
        datasources = []
        for ds_id in datasource_ids:
            datasource_raw = self.mongodb.datasources.find_one({"_id": ObjectId(ds_id)})
            if datasource_raw:
                datasource = create_datasource(datasource_raw)
                context = self.mongodb["datasource-contexts"].find_one({"_id": ObjectId(ds_id)})
                datasource.meta = context if context else {}
                datasources.append(datasource)
        return datasources

    def _prepare_messages(self, hypothesis: Dict, datasources: List[DataSource]) -> List[Dict]:
        """Prepare messages for OpenAI chat completion"""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": hypothesis["hypothesis_main_idea"]}
        ]
        
        if datasources:
            datasources_explanation = "You have the following datasources:\n"
            datasources_explanation += "\n".join(ds.context_prompt() for ds in datasources)
            messages.append({"role": "system", "content": datasources_explanation})
            
        return messages

    def process(self, hypothesis: Dict) -> Dict:
        """Process a single hypothesis using OpenAI and return the results"""
        datasources = self._get_datasources(hypothesis.get("datasourceIds", []))
        messages = self._prepare_messages(hypothesis, datasources)
        used_tools = []
        
        response = self.client.chat.completions.create(
            messages=messages,
            response_format=SUMMARY_OUTPUT_SCHEME,
            tools=tools.TOOLS,
            **OPENAI_CONFIG
        )

        tool_calls_count = 0
        while response.choices[0].message.tool_calls:
            logging.info("Processing tool calls...")
            if tool_calls_count >= MAX_TOOL_CALLS:
                logging.error("Too many function calls")
                raise Exception("Too many function calls")

            used_tools.extend(tools.handle_tools(response, messages, datasources))

            response = self.client.chat.completions.create(
                messages=messages,
                response_format=SUMMARY_OUTPUT_SCHEME,
                tools=tools.TOOLS,
                **OPENAI_CONFIG
            )
            tool_calls_count += 1

        try:
            result = json.loads(response.choices[0].message.content)
            result["used_tools"] = used_tools
            result["updated_at"] = datetime.utcnow()
            return result
        except Exception as e:
            logging.error(f"Error processing hypothesis: {e}")
            raise
