import { NextResponse } from 'next/server';
import { createDataSourceConnection } from '@/libs/DataSourceConnection';
import { getDataSourceCredentials } from '@/libs/DataSourceConnection';
import { DataSourceType } from '@/types/DataSource';
import { RowDataPacket } from 'mysql2';

interface TableInfoResponse {
    showCreateTable: string[];
}

async function getMySQLTableInfo(db: any, tableName: string): Promise<string[]> {
    const [showCreateTable] = await db.execute(
        'SHOW CREATE TABLE ??',
        [tableName]
    );
    return showCreateTable.map((row: RowDataPacket) => Object.values(row)[0] as string);
}

async function getSQLiteTableInfo(db: any, tableName: string): Promise<string[]> {
    const [sqliteTable] = await db.execute(
        'SELECT sql FROM sqlite_master WHERE type=? AND name=?',
        ['table', tableName]
    );
    return sqliteTable.map((row: RowDataPacket) => row.sql as string);
}

async function getTableInfo(db: any, type: DataSourceType, tableName: string): Promise<string[]> {
    switch (type) {
        case DataSourceType.MySQL:
            return getMySQLTableInfo(db, tableName);
        case DataSourceType.SQLite:
            return getSQLiteTableInfo(db, tableName);
        default:
            throw new Error(`Unsupported database type: ${type}`);
    }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string; tableName: string } }
): Promise<NextResponse<TableInfoResponse | { error: string; details?: string }>> {
    let db;
    try {
        const credentials = await getDataSourceCredentials(params.id);
        if (!credentials) {
            throw new Error('Data source credentials not found');
        }

        db = await createDataSourceConnection(params.id);
        const tableInfo = await getTableInfo(db, credentials.type, params.tableName);

        return NextResponse.json({ showCreateTable: tableInfo }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching table info:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Database error', details: errorMessage },
            { status: 500 }
        );
    } finally {
        if (db) {
            await db.end().catch(err =>
                console.error('Error closing database connection:', err)
            );
        }
    }
}


