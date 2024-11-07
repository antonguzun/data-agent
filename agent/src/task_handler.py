import logging
import os
import time
import traceback
from datetime import datetime

from pymongo import MongoClient

from agents.datasource_agents.hypothesis_agent import HypothesisProcessor
from agents.datasource_agents.question_agent import QuestionProcessor
from agents.task_categorizer import TaskCategorizer
from agents.chat_agent import ChatAgent
from config import TaskStatus, MONITOR_SLEEP_TIME
from init_test_db import import_test_db
from logs import init_logger
from schemes.task_categorizer import TaskCategories


class TaskMonitor:
    """Monitors and processes hypothesis tasks"""

    def __init__(self):
        init_logger()
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client["research_db"]
        self.hypothesis_processor = HypothesisProcessor(self.db)
        self.question_processor = QuestionProcessor(self.db)
        self.categorizer = TaskCategorizer()
        self.chat_agent = ChatAgent(self.db)

    def _update_task_status(self, task_id, status, task_type=None, **kwargs):
        """Update task status and additional fields"""
        update_data = {"status": status.value, "updated_at": datetime.utcnow()}
        if task_type:
            update_data["task_type"] = task_type.value
        update_data.update(kwargs)

        self.db.tasks.update_one({"_id": task_id}, {"$set": update_data})

    def _mark_task_failed(self, task_id, exc):
        """Mark task as failed with an error message"""
        logging.error(f"Traceback:\n{traceback.format_exc()}")
        logging.error(f"Error processing task: {exc}")
        self._update_task_status(task_id, TaskStatus.FAILED, error=str(exc))

    def _process_new_task(self, task):
        """Process a new task and update its status"""
        logging.info(f"Processing task: {task['_id']}")

        task_type = self.categorizer.categorize(task["query"])
        self._update_task_status(task["_id"], TaskStatus.PROCESSING, task_type)

        try:
            if task_type == TaskCategories.HYPOTHESIS:
                result = self.hypothesis_processor.process(task)

            elif task_type == TaskCategories.GENERAL_QUESTION:
                result = self.question_processor.process(task)

            else:
                logging.error(f"Unknown task type: {task_type}")
                raise ValueError(f"Unknown task type: {task_type}")
        except Exception as e:
            self._mark_task_failed(task["_id"], e)
            result = {"error": str(e)}
            raise e

        try:
            self._update_task_status(
                task["_id"],
                TaskStatus.COMPLETED,
                **result,
            )
            logging.info(f"Task {task['_id']} processed")

        except Exception as e:
            self._mark_task_failed(task["_id"], e)

    def run(self):
        """Start monitoring for new tasks"""
        import_test_db(self.db)

        while True:
            try:
                # Check for new tasks
                new_task = self.db.tasks.find_one({"status": "pending"})
                if new_task:
                    self._process_new_task(new_task)

                time.sleep(MONITOR_SLEEP_TIME)

            except Exception as e:
                logging.exception(f"Monitor error: {e}")
                time.sleep(MONITOR_SLEEP_TIME)


if __name__ == "__main__":
    monitor = TaskMonitor()
    monitor.run()
