import logging
import os
import time
import traceback
from datetime import datetime

from pymongo import MongoClient

from agents.task_categorizer import TaskCategorizer
from config import TaskStatus, MONITOR_SLEEP_TIME
from hypothesis_processor import HypothesisProcessor
from init_test_db import import_test_db
from logs import init_logger


class TaskMonitor:
    """Monitors and processes hypothesis tasks"""

    def __init__(self):
        init_logger()
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client["research_db"]
        self.processor = HypothesisProcessor(self.db)
        self.categorizer = TaskCategorizer()

    def _update_task_status(self, task_id, status, task_type=None, **kwargs):
        """Update task status and additional fields"""
        update_data = {"status": status.value, "updated_at": datetime.utcnow()}
        if task_type:
            update_data["task_type"] = task_type.value
        update_data.update(kwargs)

        self.db.tasks.update_one({"_id": task_id}, {"$set": update_data})

    def _process_new_task(self, task):
        """Process a new task and update its status"""
        logging.info(f"Processing task: {task['_id']}")

        task_type = self.categorizer.categorize(task["query"])
        self._update_task_status(task["_id"], TaskStatus.PROCESSING, task_type)

        try:
            result = self.processor.process(task)

            if not result.get("used_tools"):
                return

            self._update_task_status(
                task["_id"],
                TaskStatus.COMPLETED,
                research_summary=result.get("research_summary"),
                short_summary=result.get("short_summary"),
                support_strength=result.get("support_strength"),
                used_tools=result.get("used_tools", []),
            )

        except Exception as e:
            logging.error(f"Traceback:\n{traceback.format_exc()}")
            logging.error(f"Error processing task: {e}")

            self._update_task_status(task["_id"], TaskStatus.FAILED, error=str(e))

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
