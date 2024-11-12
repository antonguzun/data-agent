from enum import Enum
from bson import ObjectId
from pydantic import BaseModel, Field, ValidationError, field_validator


class DataSourceType(str, Enum):
    MYSQL = "mysql"
    POSTGRES = "postgres"
    MONGODB = "mongodb"
    SQLITE = "sqlite"
    CLICKHOUSE = "clickhouse"


class BaseDataSource(BaseModel):
    id: str = Field(alias="_id")
    name: str
    type: DataSourceType
    position: int
    meta: dict | None = {}

    @field_validator('id', mode='before')
    @classmethod
    def validate_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    def context_prompt(self) -> str:
        context = (
            f"""<datasource_{self.name}>"""
            f"""<datasourceId>{self.id}</datasourceId>"""
            f"""<datasourceType>{self.type}</datasourceType>"""
        )
        if self.meta:
            for key, value in self.meta.items():
                context += f"""<{key}>{value}</{key}>"""
        context += f"""</datasource_{self.name}>"""
        return context


class SQLiteDataSource(BaseDataSource):
    path: str
    type: DataSourceType = DataSourceType.SQLITE


class NetworkDataSource(BaseDataSource):
    host: str
    port: str
    username: str
    password: str
    database: str


class MySQLDataSource(NetworkDataSource):
    type: DataSourceType = DataSourceType.MYSQL

class PostgresDataSource(NetworkDataSource):
    type: DataSourceType = DataSourceType.POSTGRES


class MongoDBDataSource(NetworkDataSource):
    type: DataSourceType = DataSourceType.MONGODB


class ClickhouseDataSource(NetworkDataSource):
    type: DataSourceType = DataSourceType.CLICKHOUSE


DataSource = (
    SQLiteDataSource
    | MySQLDataSource
    | PostgresDataSource
    | MongoDBDataSource
    | ClickhouseDataSource
)


def create_datasource(data: dict) -> DataSource:
    """
    Factory method to create appropriate DataSource instance from dictionary data

    Args:
        data: Dictionary containing datasource configuration

    Returns:
        Appropriate DataSource model instance

    Raises:
        ValueError: If datasource type is invalid or required fields are missing
    """
    try:
        source_type = DataSourceType(data.get("type", ""))

        datasource_map = {
            DataSourceType.SQLITE: SQLiteDataSource,
            DataSourceType.MYSQL: MySQLDataSource,
            DataSourceType.POSTGRES: PostgresDataSource,
            DataSourceType.MONGODB: MongoDBDataSource,
            DataSourceType.CLICKHOUSE: ClickhouseDataSource,
        }

        model_class = datasource_map.get(source_type)
        if not model_class:
            raise ValueError(f"Invalid datasource type: {source_type}")

        return model_class(**data)

    except ValidationError as e:
        raise ValueError(f"Invalid datasource configuration: {str(e)}")
    except ValueError as e:
        raise ValueError(f"Invalid datasource type: {str(e)}")
