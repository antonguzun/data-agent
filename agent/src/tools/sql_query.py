import sqlite3
import mysql.connector
from mysql.connector import Error
from clickhouse_driver import Client

from models.datasource import (
    DataSourceType,
    SQLiteDataSource,
    MySQLDataSource,
    ClickhouseDataSource,
)


def execute_sqllite(datasource: SQLiteDataSource, query, params=None):
    conn = sqlite3.connect(datasource.path)
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        results = cursor.fetchall()
        return results
    finally:
        conn.close()


def execute_clickhouse(datasource: ClickhouseDataSource, query, params=None):
    try:
        client = Client(
            host=datasource.host,
            user=datasource.username,
            password=datasource.password,
            database=datasource.database,
        )
        results = client.execute(query, params or {})
        return results
    except Exception as e:
        print(f"Error: {e}")
        return None


def execute_mysql(datasource: MySQLDataSource, query, params=None):
    connection = None
    cursor = None
    try:
        # Establish the connection
        connection = mysql.connector.connect(
            host=datasource.host,
            user=datasource.username,
            password=datasource.password,
            database=datasource.database,
        )

        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(query)
            results = cursor.fetchall()
            return results

    except Error as e:
        print(f"Error: {e}")
        return None

    finally:
        if connection and connection.is_connected():
            if cursor:
                cursor.close()
            connection.close()


def execute_sql_query(query, params=None, **kwargs):
    """
    Execute a SQL query on the SQLite database.

    Args:
    query (str): The SQL query to execute.
    params (tuple, optional): Parameters for the SQL query.

    Returns:
    list: A list of tuples containing the query results.
    """
    datasourceId = kwargs.get("datasourceId")
    datasources = kwargs.get("datasources")
    if not datasourceId:
        raise Exception("No datasourceId provided")
    if not datasources:
        raise Exception("No datasources provided")

    datasource = next(filter(lambda x: str(x.id) == datasourceId, datasources))

    if datasource.type == DataSourceType.SQLITE:
        return execute_sqllite(datasource, query, params)
    elif datasource.type == DataSourceType.MYSQL:
        return execute_mysql(datasource, query, params)
    elif datasource.type == DataSourceType.CLICKHOUSE:
        return execute_clickhouse(datasource, query, params)
    else:
        raise Exception(f"{datasource.type} datasources are not supported")
