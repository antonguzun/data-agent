import json
from datetime import datetime

from openai import OpenAI
from pymongo import MongoClient

from schemes import SUMMARY_OUTPUT_SCHEME
from tools import TOOLS, handle_tools


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


if __name__ == "__main__":
    messages = []
    messages.append(
        {
            "role": "system",
            "content": "You are a professional data analyst. Use the supplied tools to assist the user",
        }
    )
    # messages.append({"role": "user", "content": DATA})

    client = OpenAI()

    response = client.chat.completions.create(
        messages=messages,
        response_format=SUMMARY_OUTPUT_SCHEME,
        **CONVERSATION_KWARGS,
    )

    used_tools = []

    counter = 3
    while response.choices[0].message.tool_calls:
        print("functions call")
        if counter < 1:
            res = json.loads(response.choices[0].message.content)
            res["used_tools"] = used_tools
            print(json.dumps(res, indent=2))
            raise Exception("too many function calls")

        used_tools.extend(handle_tools(response, messages))

        response = client.chat.completions.create(
            messages=messages,
            response_format=SUMMARY_OUTPUT_SCHEME,
            **CONVERSATION_KWARGS,
        )
        counter -= 1

    try:
        res = json.loads(response.choices[0].message.content)
        res["used_tools"] = used_tools
        print(json.dumps(res, indent=2))
        res["created_at"] = datetime.utcnow()
        
        # Save to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['research_db']
        collection = db['hypothesis']
        collection.insert_one(res)
        
    except Exception as e:
        print("Error:", e)
        print(response)
        raise e
