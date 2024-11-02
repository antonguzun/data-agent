import logging
import os
import time
import traceback
from datetime import datetime

from pymongo import MongoClient

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
        
    def _update_task_status(self, hypothesis_id, status, **kwargs):
        """Update hypothesis status and additional fields"""
        update_data = {"status": status.value, "updated_at": datetime.utcnow()}
        update_data.update(kwargs)
        
        self.db.hypothesis.update_one(
            {"_id": hypothesis_id},
            {"$set": update_data}
        )

    def _process_new_hypothesis(self, hypothesis):
        """Process a new hypothesis and update its status"""
        logging.info(f"Processing hypothesis: {hypothesis['_id']}")
        
        self._update_task_status(hypothesis["_id"], TaskStatus.PROCESSING)
        
        try:
            result = self.processor.process(hypothesis)
            
            if not result.get("used_tools"):
                return
                
            self._update_task_status(
                hypothesis["_id"],
                TaskStatus.COMPLETED,
                research_summary=result.get("research_summary"),
                short_summary=result.get("short_summary"),
                support_strength=result.get("support_strength"),
                used_tools=result.get("used_tools", [])
            )
            
        except Exception as e:
            logging.error(f"Traceback:\n{traceback.format_exc()}")
            logging.error(f"Error processing hypothesis: {e}")
            
            self._update_task_status(
                hypothesis["_id"],
                TaskStatus.FAILED,
                error=str(e)
            )

    def run(self):
        """Start monitoring for new hypotheses"""
        import_test_db(self.db)
        
        while True:
            try:
                new_hypothesis = self.db.hypothesis.find_one({"status": "pending"})
                
                if new_hypothesis:
                    self._process_new_hypothesis(new_hypothesis)
                    
                time.sleep(MONITOR_SLEEP_TIME)
                
            except Exception as e:
                logging.error(f"Monitor error: {e}")
                time.sleep(MONITOR_SLEEP_TIME)


if __name__ == "__main__":
    monitor = TaskMonitor()
    monitor.run()
