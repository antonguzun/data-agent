from enum import Enum
import json
import os
import time
from datetime import datetime

from bson import ObjectId
from openai import OpenAI
from pymongo import MongoClient
from typing import Dict

from logs import init_logger
from init_test_db import import_test_db
from schemes import SUMMARY_OUTPUT_SCHEME
from tools import TOOLS, handle_tools
import traceback


class HypothesisStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


MODEL = "gpt-4o-mini"


CONVERSATION_KWARGS = dict(
    model=MODEL,
    temperature=1,
    max_tokens=2048,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0,
    tools=TOOLS,
    parallel_tool_calls=True,
)


def process_hypothesis(hypothesis: Dict, mdb) -> Dict:
    """Process a single hypothesis using OpenAI and return the results"""

    messages = []
    messages.append(
        {
            "role": "system",
            "content": "You are a professional data analyst. Use the supplied tools to assist the user",
        }
    )

    # Get datasource credentials for the hypothesis
    datasource_ids = hypothesis.get("datasourceIds", [])
    datasources = []
    for ds_id in datasource_ids:
        datasource = mdb.datasources.find_one({"_id": ObjectId(ds_id)})
        if datasource:
            datasource["tables"] = mdb["datasource-contexts"].find_one(
                {"_id": ObjectId(ds_id)}
            )["tables"]
            datasources.append(datasource)

    # Add hypothesis content as user message
    messages.append({"role": "user", "content": hypothesis["hypothesis_main_idea"]})

    client = OpenAI()
    used_tools = []

    datasources_explanation = """You have the following datasources:\n"""
    if datasources:
        for ds in datasources:
            datasources_explanation += (
                f"""<datasource_{ds['name']}>{ds['tables']}</datasource_{ds['name']}"""
            )
        messages.append(
            {
                "role": "system",
                "content": datasources_explanation,
            }
        )
    response = client.chat.completions.create(
        messages=messages,
        response_format=SUMMARY_OUTPUT_SCHEME,
        **CONVERSATION_KWARGS,
    )

    counter = 3
    while response.choices[0].message.tool_calls:
        print("Processing tool calls...")
        if counter < 1:
            res = json.loads(response.choices[0].message.content)
            res["used_tools"] = used_tools
            print(json.dumps(res, indent=2))
            raise Exception("too many function calls")

        used_tools.extend(handle_tools(response, messages, datasources))

        response = client.chat.completions.create(
            messages=messages,
            response_format=SUMMARY_OUTPUT_SCHEME,
            **CONVERSATION_KWARGS,
        )
        counter -= 1

    try:
        res = json.loads(response.choices[0].message.content)
        res["used_tools"] = used_tools
        res["updated_at"] = datetime.utcnow()
        return res
    except Exception as e:
        print(f"Error processing hypothesis: {e}")

        raise e


def monitor_tasks():
    """Monitor MongoDB for new hypotheses and process them"""
    init_logger()

    client = MongoClient(os.getenv("MONGODB_URI"))

    db = client["research_db"]
    import_test_db(db)

    while True:
        try:
            # Find new hypotheses
            new_hypothesis = db.hypothesis.find_one({"status": "pending"})

            if new_hypothesis:
                print(f"Processing new hypothesis: {new_hypothesis['hypothesis_name']}")

                # Update status to processing
                db.hypothesis.update_one(
                    {"_id": new_hypothesis["_id"]},
                    {"$set": {"status": HypothesisStatus.PROCESSING.value}},
                )

                try:
                    # Process the hypothesis
                    result = process_hypothesis(new_hypothesis, db)

                    # Update the hypothesis with results
                    print(result)
                    db.hypothesis.update_one(
                        {"_id": new_hypothesis["_id"]},
                        {
                            "$set": {
                                "status": HypothesisStatus.COMPLETED.value,
                                "research_summary": result.get("research_summary"),
                                "short_summary": result.get("short_summary"),
                                "support_strength": result.get("support_strength"),
                                "used_tools": result.get("used_tools", []),
                                "updated_at": datetime.utcnow(),
                            }
                        },
                    )
                except Exception as e:
                    print(f"Traceback:\n{traceback.format_exc()}")
                    print(f"Error processing hypothesis: {e}")
                    db.hypothesis.update_one(
                        {"_id": new_hypothesis["_id"]},
                        {
                            "$set": {
                                "status": HypothesisStatus.FAILED.value,
                                "error": str(e),
                                "updated_at": datetime.utcnow(),
                            }
                        },
                    )

            time.sleep(1)  # Wait 5 seconds before next check

        except Exception as e:
            print(f"Monitor error: {e}")
            time.sleep(1)  # Wait longer on error


if __name__ == "__main__":
    monitor_tasks()
