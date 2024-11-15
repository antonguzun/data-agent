import { getDataSourceCredentials } from '@/libs/DataSourceConnection';
import { DataSourceType, IDataSource } from '@/types/DataSource';
import { createClient, NodeClickHouseClient } from '@clickhouse/client/dist/client';
import { Connection } from 'mysql2/promise';
import { Client } from 'pg';
import { Database } from 'sqlite3';
import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import { promisify } from 'util';

export interface IDatabaseOperations {
    init(): Promise<void>;
    close(): Promise<void>;
    fetchTableList(): Promise<string[]>;
    fetchTableDefinition(tableName: string): Promise<string>;
    testConnection(): Promise<void>;
}


export class MySQLDatabaseOperations implements IDatabaseOperations {
    private connection: Connection | null = null;
    private creds: IDataSource;
    constructor(creds: IDataSource) {
        this.creds = creds;
    }

    async init(): Promise<void> {
        try {
            this.connection = await mysql.createConnection({
                host: this.creds.host,
                user: this.creds.username,
                port: parseInt(this.creds.port || '3306'),
                password: this.creds.password,
                database: this.creds.database,
            });
        } catch (error) {
            console.error('Error creating MySQL connection:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
        }
    }

    async fetchTableList(): Promise<string[]> {
        if (!this.connection) throw new Error("Database not initialized");
        const [tables] = await this.connection.execute("SHOW TABLES");
        return (tables as any[]).map(row => Object.values(row)[0] as string);
    }

    async fetchTableDefinition(tableName: string): Promise<string> {
        if (!this.connection) throw new Error("Database not initialized");
        const [showCreateTable] = await this.connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
        return (showCreateTable as any[])[0]['Create Table'];
    }

    async testConnection(): Promise<void> {
        if (!this.connection) throw new Error("Database not initialized");
        try {
            await this.connection.query('SELECT 1');
        } catch (error) {
            console.error('Error testing MySQL connection:', error);
            throw error;
        }
    }
}

export class SQLiteDatabaseOperations implements IDatabaseOperations {
    private db: Database | null = null;
    private credentials: any;

    constructor(credentials: any) {
        this.credentials = credentials;
    }

    async init(): Promise<void> {
        if (!this.credentials.path) {
            throw new Error('SQLite database path is required');
        }
        this.db = new sqlite3.Database(this.credentials.path);
    }

    async close(): Promise<void> {
        if (this.db) {
            await new Promise<void>((resolve, reject) => {
                this.db!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    async fetchTableList(): Promise<string[]> {
        if (!this.db) throw new Error("Database not initialized");
        interface SQLiteTableRow {
            name: string;
        }
        const dbAll = promisify<string, SQLiteTableRow[]>(this.db.all).bind(this.db);
        const tables = await dbAll(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        return tables.map(row => row.name);
    }

    async fetchTableDefinition(tableName: string): Promise<string> {
        if (!this.db) throw new Error("Database not initialized");
        interface SQLiteTableDefinition {
            sql: string;
        }
        const dbAll = promisify<string, [string], SQLiteTableDefinition[]>(this.db.all).bind(this.db);
        const result = await dbAll(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?",
            [tableName]
        );
        if (!result.length) throw new Error(`Table ${tableName} not found`);
        return result[0].sql;
    }

    async testConnection(): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");
        const dbAll = promisify(this.db.all).bind(this.db);
        await dbAll("SELECT 1");
    }
}

export class ClickHouseDatabaseOperations implements IDatabaseOperations {
    private client: NodeClickHouseClient | null = null;
    private credentials: any;

    constructor(credentials: any) {
        this.credentials = credentials;
    }

    async init(): Promise<void> {
        const url = `http://${this.credentials.username}:${this.credentials.password}@${this.credentials.host}:${this.credentials.port || '8123'}/${this.credentials.database}`;
        this.client = createClient({ url });
        if (!(await this.client.ping())) {
            throw new Error('Failed to ping ClickHouse');
        }
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
    }

    async fetchTableList(): Promise<string[]> {
        if (!this.client) throw new Error("Database not initialized");
        const result = await this.client.query({
            query: 'SELECT name FROM system.tables WHERE database = currentDatabase()',
            format: 'JSONEachRow'
        });
        const data = await result.json();
        return data.map((row: any) => row.name);
    }

    async fetchTableDefinition(tableName: string): Promise<string> {
        if (!this.client) throw new Error("Database not initialized");
        const result = await this.client.query({
            query: `SHOW CREATE TABLE ${tableName}`,
            format: 'JSONEachRow'
        });
        const data = await result.json();
        return (data as any[])[0]['statement'];
    }
    async testConnection(): Promise<void> {
        if (!this.client) throw new Error("Database not initialized");
        await this.client.query({
            query: `SELECT 1`,
            format: 'JSONEachRow'
        });

    }
}

export class PostgresDatabaseOperations implements IDatabaseOperations {
    private client: Client | null = null;
    private credentials: IDataSource;

    constructor(credentials: IDataSource) {
        this.credentials = credentials;
    }

    async init(): Promise<void> {
        this.client = new Client({
            host: this.credentials.host,
            user: this.credentials.username,
            password: this.credentials.password,
            database: this.credentials.database,
            port: parseInt(this.credentials.port || '5432'),
        });
        await this.client.connect();
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.end();
        }
    }

    async fetchTableList(): Promise<string[]> {
        if (!this.client) throw new Error("Database not initialized");
        const result = await this.client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        return result.rows.map(row => row.table_name);
    }

    async fetchTableDefinition(tableName: string): Promise<string> {
        if (!this.client) throw new Error("Database not initialized");
        const result = await this.client.query(
            `SELECT                                          
            'CREATE TABLE ' || relname || E'\n(\n' ||
            array_to_string(
                array_agg(
                '    ' || column_name || ' ' ||  type || ' '|| not_null
                )
                , E',\n'
            ) || E'\n);\n'
            from
            (
            SELECT 
                c.relname, a.attname AS column_name,
                pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
                case 
                when a.attnotnull
                then 'NOT NULL' 
                else 'NULL' 
                END as not_null 
            FROM pg_class c,
            pg_attribute a,
            pg_type t
            WHERE c.relname = '${tableName}'
            AND a.attnum > 0
            AND a.attrelid = c.oid
            AND a.atttypid = t.oid
            ORDER BY a.attnum
            ) as tabledefinition
            group by relname;`
        );
        // console.log('PG SCHEMA', result.rows[0]['?column?']);
        return result.rows[0]['?column?'];
    }

    async testConnection(): Promise<void> {
        if (!this.client) throw new Error("Database not initialized");
        await this.client.query('SELECT 1');
    }
}

export async function createDatabaseOperations(
    datasourceId: string,
): Promise<IDatabaseOperations> {
    const credentials = await getDataSourceCredentials(datasourceId);

    switch (credentials.type) {
        case DataSourceType.MySQL:
            return new MySQLDatabaseOperations(credentials);
        case DataSourceType.SQLite:
            return new SQLiteDatabaseOperations(credentials);
        case DataSourceType.ClickHouse:
            return new ClickHouseDatabaseOperations(credentials);
        case DataSourceType.Postgres:
            return new PostgresDatabaseOperations(credentials);
        default:
            throw new Error(`Unsupported database type: ${credentials.type}`);
    }
}
