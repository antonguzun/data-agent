SUMMARY_OUTPUT_SCHEME = {
    "type": "json_schema",
    "json_schema": {
        "name": "research_hypothesis_review",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "hypothesis_name": {
                    "type": "string",
                    "description": "The name of the hypothesis being proposed.",
                },
                "hypothesis_main_idea": {
                    "type": "string",
                    "description": "A brief statement outlining the main idea or premise of the hypothesis.",
                },
                "research_summary": {
                    "type": "string",
                    "description": "A comprehensive summary of the research conducted.",
                },
                "short_summary": {
                    "type": "string",
                    "description": "A brief statement summarizing the research findings.",
                },
                "support_strength": {
                    "type": "string",
                    "description": "Indicates the strength of the support for the hypothesis based on the research findings.",
                    "enum": ["weak", "strong", "mixed"],
                },
            },
            "required": [
                "hypothesis_name",
                "hypothesis_main_idea",
                "research_summary",
                "short_summary",
                "support_strength",
            ],
            "additionalProperties": False,
        },
    },
}
