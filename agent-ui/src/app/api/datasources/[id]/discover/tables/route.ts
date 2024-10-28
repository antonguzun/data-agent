import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { createDataSourceConnection, getDataSourceCredentials } from '@/libs/DataSourceConnection';
import { DataSourceType } from '@/types/DataSource';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    var db;
    try {
        const credentials = await getDataSourceCredentials(params.id);
        if (!credentials) {
            throw new Error('Data source credentials not found');
        }

        db = await createDataSourceConnection(params.id);
        let tables;

        switch (credentials.type) {
            case DataSourceType.MySQL:
                const [mysqlTables] = await db.execute("SHOW TABLES") as [Record<string, any>[], any];
                tables = mysqlTables.map(row => Object.values(row)[0]);
                break;

            case DataSourceType.SQLite:
                const [sqliteTables] = await db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ) as [Record<string, any>[], any];
                tables = sqliteTables.map(row => row.name);
                break;

            default:
                throw new Error(`Unsupported database type: ${credentials.type}`);
        }

        console.log(tables);
        return NextResponse.json({tableNames: tables}, { status: 200 });
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Database error', details: errorMessage },
            { status: 500 }
        );
    } finally {
        if (db) {
            await db.end();
        }
    }
}


