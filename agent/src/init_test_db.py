import os
import logging
from pymongo import MongoClient
import kagglehub

logger = logging.getLogger(__name__)


def import_test_db(db: MongoClient):
    """Initialize test database with wildfire dataset if IMPORT_TEST_DB is set."""
    if not os.getenv("IMPORT_TEST_DB"):
        logger.info("Skipping test DB import (IMPORT_TEST_DB not set)")
        return

    # Check if wildfires database already exists
    existing_datasource = db.datasources.find_one({"name": "wildfires"})
    if existing_datasource:
        logger.info("Wildfires database already exists, skipping import")
        return

    logger.info("Starting test database initialization")
    try:
        path = kagglehub.dataset_download("rtatman/188-million-us-wildfires")
        logger.info(f"Downloaded dataset to: {path}")

        datasource = {
            "name": "wildfires",
            "type": "sqlite",
            "path": path + '/FPA_FOD_20170508.sqlite',
            "position": 9999.0,
        }
        result = db.datasources.insert_one(datasource)
        logger.info(f"Successfully inserted datasource with ID: {result.inserted_id}")
        logger.info(
            "Please, don't forget to setup context for the database 'wildfires' in datasource manager ui"
        )

    except Exception as e:
        logger.error(f"Failed to initialize test database: {str(e)}")
        raise
