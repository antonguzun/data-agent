import sqlite3
import mysql.connector
from mysql.connector import Error

from models.datasource import DataSourceType, DataSource


def execute_sqllite(datasource: DataSource, query, params=None):
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


def execute_mysql(datasource: DataSource, query, params=None):
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
        if connection.is_connected():
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
    else:
        raise Exception(f"{datasource.type} datasources are not supported")
