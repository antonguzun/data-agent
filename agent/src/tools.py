import json
import os
import sqlite3
import mysql.connector
from mysql.connector import Error


def execute_sqllite(datasource, query, params=None):
    conn = sqlite3.connect(datasource["path"])
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        results = cursor.fetchall()
        return results
    finally:
        conn.close()


def execute_mysql(datasource, query, params=None):
    try:
        # Establish the connection
        connection = mysql.connector.connect(
            host=datasource["host"],
            user=datasource["username"],
            password=datasource["password"],
            database=datasource["database"],
        )

        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)
            results = cursor.fetchall()
            return results

    except Error as e:
        print(f"Error: {e}")
        return None

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


def execute_sql_query(query, params=None, **kwargs):
    """
    Execute a SQL query on the SQLite database.

    Args:
    query (str): The SQL query to execute.
    params (tuple, optional): Parameters for the SQL query.

    Returns:
    list: A list of tuples containing the query results.
    """
    datasourceId = kwargs.get("datasourceId")
    datasources = kwargs.get("datasources")
    if not datasourceId:
        raise Exception("No datasourceId provided")
    if not datasources:
        raise Exception("No datasources provided")

    datasource = next(filter(lambda x: str(x["_id"]) == datasourceId, datasources))

    if datasource["type"] == "sqlite":
        return execute_sqllite(datasource, query, params)
    elif datasource["type"] == "mysql":
        return execute_mysql(datasource, query, params)
    else:
        raise Exception(f"{datasource['type']} datasources are not supported")


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


def handle_tools(resp, messages: list, datasources) -> list:
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
