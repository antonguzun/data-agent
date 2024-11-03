from enum import StrEnum


class TaskCategories(StrEnum):
    HYPOTHESIS = "hypothesis"
    GENERAL_QUESTION = "general_question"


TASK_CATEGORIES = [
    TaskCategories.GENERAL_QUESTION.value,
    TaskCategories.HYPOTHESIS.value,
]

CATEGORIZER_OUTPUT_SCHEME = {
    "type": "json_schema",
    "json_schema": {
        "name": "query_categorization",
        "schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The question or query that needs to be categorized.",
                },
                "category": {
                    "type": "string",
                    "description": "The category of the query, which can be one of enum value.",
                    "enum": TASK_CATEGORIES,
                },
            },
            "required": ["query", "category"],
            "additionalProperties": False,
        },
        "strict": True,
    },
}
