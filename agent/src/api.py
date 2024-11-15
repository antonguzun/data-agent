import json
import logging
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from openai import OpenAI
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

from agents.chat_agent import ChatOpenAIDatasourceAgent
from chat_processor import Conversation

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# MongoDB connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["research_db"]


class DatasourceRequest(BaseModel):
    datasourceIds: List[str]


HYPOTHESIS_PROMPT = """
Based on the provided database structure, generate a meaningful hypothesis that could be investigated using this data.
Consider relationships between tables, potential patterns, or interesting questions that could be answered.
Focus on creating an analytical hypothesis that can be tested with SQL queries.
Please return only one statement hypothesis as short as possible.
"""

MODEL = "gpt-4o"


@app.post("/generate-hypothesis")
async def generate_hypothesis(request: DatasourceRequest):
    # Validate request
    if not request.datasourceIds:
        raise HTTPException(status_code=400, detail="No datasource IDs provided")

    # Fetch datasource contexts
    datasources = []
    for ds_id in request.datasourceIds:
        try:
            datasource = db.datasources.find_one({"_id": ObjectId(ds_id)})
            if datasource:
                datasource["tables"] = (
                    db["datasource-contexts"]
                    .find_one({"_id": ObjectId(ds_id)})
                    .get("tables", [])
                )
                datasources.append(datasource)
        except Exception as e:
            logging.exception(f"Error fetching datasource context: {str(e)}")
            raise HTTPException(
                status_code=404, detail=f"Datasource not found: {ds_id}"
            )

    if not datasources:
        raise HTTPException(status_code=404, detail="No valid datasources found")

    # Prepare context for OpenAI
    datasources_explanation = "Available datasources and their structure:\n"
    for ds in datasources:
        datasources_explanation += f"\nDatasource '{ds['name']}':\n"
        datasources_explanation += f"Tables: {ds['tables']}\n"

    # Prepare messages for OpenAI
    messages = [
        {
            "role": "system",
            "content": "You are a data analyst tasked with generating research hypotheses.",
        },
        {
            "role": "user",
            "content": f"{HYPOTHESIS_PROMPT}\n\n{datasources_explanation}",
        },
    ]

    try:
        # Generate hypothesis using OpenAI
        client = OpenAI()
        response = client.chat.completions.create(
            model=MODEL, messages=messages, temperature=1, max_tokens=500
        )

        # Extract hypothesis from response
        hypothesis = {
            "hypothesis_main_idea": response.choices[0].message.content,
            "datasourceIds": request.datasourceIds,
            "created_at": datetime.utcnow(),
            "status": "pending",
        }

        return hypothesis

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating hypothesis: {str(e)}"
        )



@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    
    conversation = Conversation.create(db, conversation_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get('type') == 'fix_sql':
                # Get the event ID and new query
                logging.info(f"Fixing SQL query: {message}")
                raise NotImplementedError("Fixing SQL queries is not yet implemented")
                # event_id = message.get('eventId')
                # new_query = message.get('query')
                
                # # Remove all events after the specified event ID
                # conversation.remove_events_after(db, event_id)
                
                # # Update the tool call with new query
                # conversation.update_tool_call_query(db, event_id, new_query)
                
                # # Get the last user message to restart processing
                # last_user_message = conversation.get_last_user_message(db)
                # if not last_user_message:
                #     continue
                    
                # agent = ChatOpenAIDatasourceAgent(db, conversation)
                # try:
                #     for response in agent.process(last_user_message.message, last_user_message.datasourceIds):
                #         if response:
                #             await websocket.send_text(response.model_dump_json())
                #             await asyncio.sleep(0)
                # except Exception as e:
                #     await websocket.send_text(json.dumps({
                #         "type": "error",
                #         "content": str(e)
                #     }))
                # continue
            res = conversation.add_user_message(db, message)
            await websocket.send_text(res.model_dump_json())

            if len(res.datasoruceIds) == 0:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "content": "No datasource IDs provided"
                }))
                continue

            agent = ChatOpenAIDatasourceAgent(db, conversation)
            try:
                for response in agent.process(res.message, res.datasoruceIds):
                    if response:
                        await websocket.send_text(response.model_dump_json())
                        # Give other tasks a chance to run
                        await asyncio.sleep(0)
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "content": str(e)
                }))
                
    except WebSocketDisconnect:
        print(f"Client disconnected from conversation {conversation_id}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
