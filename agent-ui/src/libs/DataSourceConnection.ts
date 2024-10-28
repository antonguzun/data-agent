import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
// import { Pool } from 'pg';
import { IDataSource, DataSourceType } from '../types/DataSource';
import { dbConnect } from './mongodb';
import {ObjectId} from 'mongodb';


export async function getDataSourceCredentials(dataSourceId: string): Promise<IDataSource | null> {
  try {
    const db = await dbConnect();
    console.log('try to find datasource:', dataSourceId);
    
    const dataSource = await db
        .collection('datasources')
        .findOne({_id: new ObjectId(dataSourceId)});
    console.log('dataSource by id:', dataSource);

    if (!dataSource) {
        return null;
    }

    // Ensure the document has all required IDataSource properties
    const typedDataSource: IDataSource = {
        _id: dataSource._id.toString(),
        name: dataSource.name,
        type: dataSource.type,
        position: dataSource.position,
        host: dataSource.host,
        username: dataSource.username,
        password: dataSource.password,
        database: dataSource.database,
        port: dataSource.port,
        path: dataSource.path
    };

    return typedDataSource;
  } catch (error) {
    console.error('Error fetching data source credentials:', error);
    return null;
  }
}

export async function createDataSourceConnection(dataSourceId: string) {
  const credentials = await getDataSourceCredentials(dataSourceId);

  if (!credentials) {
    throw new Error('Data source credentials not found');
  }

  switch (credentials.type) {
    case DataSourceType.MySQL:
      return createMySQLConnection(credentials);
    case DataSourceType.SQLite:
      return createSQLiteConnection(credentials);
    // case 'postgres':
    //   return createPostgresConnection(credentials);
    default:
      throw new Error(`Unsupported data source type: ${credentials.type}`);
  }
}

async function createMySQLConnection(credentials: IDataSource) {
    console.log('mysql creds:', credentials)
  try {
    const connection = await mysql.createConnection({
      host: credentials.host,
      user: credentials.username,
      port: parseInt(credentials.port || '3306'),
      password: credentials.password,
      database: credentials.database,
    });
    return connection;
  } catch (error) {
    console.error('Error creating MySQL connection:', error);
    throw error;
  }
}

// function createPostgresConnection(credentials: IDataSource) {
//   try {
//     const pool = new Pool({
//         host: credentials.host,
//         user: credentials.user,
//         password: credentials.password,
//         database: credentials.database,
//         port: parseInt(process.env.POSTGRES_PORT || '5432'),
//     });
//     return pool;
//   } catch (error) {
//     console.error('Error creating PostgreSQL connection:', error);
//     throw error;
//   }
// }

async function createSQLiteConnection(credentials: IDataSource) {
  try {
    if (!credentials.path) {
      throw new Error('SQLite database path is required');
    }
    
    const db = new sqlite3.Database(credentials.path);
    
    // Promisify the necessary methods
    const dbAll = promisify<string, any[], any[]>(db.all.bind(db));
    
    // Create a wrapper object that matches the MySQL interface
    return {
      execute: async (sql: string, params: any[] = []) => {
        try {
          const results = await dbAll(sql, params);
          return [results, null];
        } catch (error) {
          throw error;
        }
      },
      query: async (sql: string, params: any[] = []) => {
        try {
          const results = await dbAll(sql, params);
          return [results, null];
        } catch (error) {
          throw error;
        }
      },
      end: async () => {
        return new Promise<void>((resolve, reject) => {
          db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };
  } catch (error) {
    console.error('Error creating SQLite connection:', error);
    throw error;
  }
}
