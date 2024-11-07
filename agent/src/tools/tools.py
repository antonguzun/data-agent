import json
from typing import Any, Generator

from chat_processor import Conversation
from models.datasource import DataSource
from tools.sql_query import execute_sql_query


def tavily_request(question: str, **_) -> str:
    from tavily import TavilyClient

    tavily_client = TavilyClient()
    response = tavily_client.search(question)
    return response


SQL_QUERY_TOOL = "execute_sql_query"
ASK_TAVILY_TOOL = "ask_tavily"
TOOLS_MAPPING = {SQL_QUERY_TOOL: execute_sql_query, ASK_TAVILY_TOOL: tavily_request}

TOOLS = [
    {
        "type": "function",
        "tool_choice": "required",
        "function": {
            "name": SQL_QUERY_TOOL,
            "description": "Executes a SQL query on the database",
            "parameters": {
                "type": "object",
                "required": ["query", "datasourceId"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The SQL query to be executed",
                    },
                    "datasourceId": {
                        "type": "string",
                        "description": "datasourceId from the provided tool",
                    },
                },
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
]

# if os.getenv("TAVILY_API_KEY"):
#     TOOLS.append(
#         {
#             "type": "function",
#             "function": {
#                 "name": ASK_TAVILY_TOOL,
#                 "description": "Search data from the internet",
#                 "parameters": {
#                     "type": "object",
#                     "required": ["query"],
#                     "properties": {
#                         "query": {
#                             "type": "string",
#                             "description": "The question to be searched",
#                         }
#                     },
#                     "additionalProperties": False,
#                 },
#                 "strict": True,
#             },
#         },
#     )


def handle_tools(resp, messages: list, datasources: list[DataSource]) -> list:
    """
    adds initial response.message and tool's results in input message parameter
    return value used only for logging
    """
    if not resp.choices[0].message.tool_calls:
        return []

    used_tools = []

    # we need to give llm his response for context
    messages.append(resp.choices[0].message)

    for tool_call in resp.choices[0].message.tool_calls:
        function_args = json.loads(tool_call.function.arguments)

        try:
            tool_func = TOOLS_MAPPING[tool_call.function.name]
            results = tool_func(
                function_args["query"],
                datasourceId=function_args["datasourceId"],
                datasources=datasources,
            )
            # Convert results to a readable format
            results_str = json.dumps(results, indent=2, default=str)
            print("execute query:")
            print(function_args["query"])
            print(results_str)

            tool_result = {
                "tool_call_id": tool_call.id,
                "content": results_str,
                "role": "tool",
            }

            messages.append(tool_result)

            used_tools.append(
                {
                    "name": tool_call.function.name,
                    "query": function_args["query"],
                    **tool_result,
                }
            )
        except Exception as e:
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": f"Error executing query: {str(e)}",
                }
            )
            used_tools.append(
                {
                    "name": tool_call.function.name,
                    "query": function_args["query"],
                    "tool_call_id": tool_call.id,
                    "content": f"Error executing query: {str(e)}",
                }
            )

    return used_tools


def handle_tools2(resp, messages: list, datasources: list[DataSource], conversation: Conversation, mongodb) -> Generator[Any, Any, Any]:
    """
    adds initial response.message and tool's results in input message parameter
    return value used only for logging
    """
    if not resp.choices[0].message.tool_calls:
        return []

    used_tools = []

    # we need to give llm his response for context
    messages.append(resp.choices[0].message)
    # event = conversation.add_message(mongodb, resp.choices[0].message)
    # yield event

    for tool_call in resp.choices[0].message.tool_calls:
        function_args = json.loads(tool_call.function.arguments)

        try:
            tool_func = TOOLS_MAPPING[tool_call.function.name]
            event = conversation.add_tool_call(mongodb, tool_call_id=tool_call.id, tool_name=tool_call.function.name, parameters=function_args)
            yield event

            results = tool_func(
                function_args["query"],
                datasourceId=function_args["datasourceId"],
                datasources=datasources,
            )
            # Convert results to a readable format
            results_str = json.dumps(results, indent=2, default=str)
            print("execute query:")
            print(function_args["query"])
            print(results_str)

            tool_result = {
                "tool_call_id": tool_call.id,
                "content": results_str,
                "role": "tool",
            }

            messages.append(tool_result)

            event = conversation.add_tool_call_result(mongodb, tool_call_id=tool_call.id, tool_name=tool_call.function.name, output=results_str)
            yield event


            used_tools.append(
                {
                    "name": tool_call.function.name,
                    "query": function_args["query"],
                    **tool_result,
                }
            )
        except Exception as e:
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": f"Error executing query: {str(e)}",
                }
            )
            event = conversation.add_tool_call_result(mongodb, tool_call_id=tool_call.id, tool_name=tool_call.function.name, output=f"Error executing query: {str(e)}")
            yield event

            used_tools.append(
                {
                    "name": tool_call.function.name,
                    "query": function_args["query"],
                    "tool_call_id": tool_call.id,
                    "content": f"Error executing query: {str(e)}",
                }
            )
