export interface IDataSource {
  _id: string;
  name: string;
  type: DataSourceType;
  position: number;
  path?: string;
  host?: string;
  username?: string;
  password?: string;
  database?: string;
  port?: string;
}

export enum DataSourceType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MongoDB = 'mongodb',
  SQLite = 'sqlite'
}
