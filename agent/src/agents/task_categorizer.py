import json

from openai import OpenAI

from schemes.task_categorizer import TaskCategories, CATEGORIZER_OUTPUT_SCHEME


class TaskCategorizer:
    """Categorizes tasks based on their content and schema"""

    PROMPT = "Please categorize the task based on the content provided."
    OPENAI_CONFIG = {
        "model": "gpt-4o-mini",
        "temperature": 1,
        "max_tokens": 2048,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
    }

    def __init__(self):
        self.client = OpenAI()

    def categorize(self, task_query: str) -> TaskCategories:
        """
        Categorize a task based on its content
        Returns TaskType or None if task type cannot be determined
        """

        messages = [
            {"role": "system", "content": self.PROMPT},
            {"role": "user", "content": task_query},
        ]

        response = self.client.chat.completions.create(
            messages=messages,
            response_format=CATEGORIZER_OUTPUT_SCHEME,
            **self.OPENAI_CONFIG,
        )
        res = json.loads(response.choices[0].message.content)

        return TaskCategories(res["category"])
