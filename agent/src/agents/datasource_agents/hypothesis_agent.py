from agents.datasource_agents.base import BaseOpenAIDatasourceAgent
from schemes.hypothesis import SUMMARY_OUTPUT_SCHEME


class HypothesisProcessor(BaseOpenAIDatasourceAgent):
    response_format = SUMMARY_OUTPUT_SCHEME
