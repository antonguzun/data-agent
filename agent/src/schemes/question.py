QUESTION_OUTPUT_SCHEME = {
    "type": "json_schema",
    "json_schema": {
        "name": "question",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "chain_of_thoughts": {
                    "type": "string",
                    "description": "Please explain your chain of thoughts.",
                },
                "question_title": {
                    "type": "string",
                    "description": "Question's title.",
                },
                "answer": {
                    "type": "string",
                    "description": "A comprehensive summary of the research conducted.",
                },
            },
            "required": [
                "chain_of_thoughts",
                "question_title",
                "answer",
            ],
            "additionalProperties": False,
        },
    },
}
