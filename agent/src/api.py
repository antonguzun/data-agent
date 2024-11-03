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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
