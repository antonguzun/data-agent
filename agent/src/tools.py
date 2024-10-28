import json
import sqlite3


def execute_sql_query(query, params=None, datasources=None, **_):
    """
    Execute a SQL query on the SQLite database.

    Args:
    query (str): The SQL query to execute.
    params (tuple, optional): Parameters for the SQL query.

    Returns:
    list: A list of tuples containing the query results.
    """
    if not datasources:
        raise Exception("No datasources provided")
    datasource = next(filter(lambda x: x["type"] == 'sqlite', datasources))
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
        "function": {
            "name": SQL_QUERY_TOOL,
            "description": "Executes a SQL query on the database",
            "parameters": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The SQL query to be executed",
                    }
                },
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
    {
        "type": "function",
        "function": {
            "name": ASK_TAVILY_TOOL,
            "description": "Search data from the internet",
            "parameters": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The question to be searched",
                    }
                },
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
]


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
            results = tool_func(function_args["query"], datasources=datasources)
            # Convert results to a readable format
            results_str = json.dumps(results, indent=2)
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
