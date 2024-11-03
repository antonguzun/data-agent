from agents.datasource_agents.base import BaseOpenAIDatasourceAgent
from schemes.question import QUESTION_OUTPUT_SCHEME


class QuestionProcessor(BaseOpenAIDatasourceAgent):
    """Processes general question tasks"""

    response_format = QUESTION_OUTPUT_SCHEME
