import { NextResponse } from 'next/server';
import { createDataSourceConnection } from '../../../../../libs/DataSourceConnection';
import { RowDataPacket } from 'mysql2';

interface TableSetting {
  is_indexed: boolean;
  comment: string;
}

interface TableInfo {
  table_name: string;
  is_indexed: boolean;
  comment: string;
}

interface Settings {
  [key: string]: TableSetting;
}

export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let db = null;
  
  try {
    db = await createDataSourceConnection(params.id);
    
    // Get table names
    const [tables] = await db.execute<RowDataPacket[]>('SHOW TABLES') as [RowDataPacket[], any];
    const tableNames = tables.map(row => Object.values(row)[0] as string);

    // Get settings for tables
    const [settingsRows] = await db.execute<RowDataPacket[]>('SELECT * FROM table_settings') as [RowDataPacket[], any];
    const settings: Settings = settingsRows.reduce((acc: Settings, row: RowDataPacket) => {
      acc[row.table_name] = {
        is_indexed: row.is_indexed,
        comment: row.comment,
      };
      return acc;
    }, {});

    // Combine table names with their settings
    const data: TableInfo[] = tableNames.map(tableName => ({
      table_name: tableName,
      ...settings[tableName] || { is_indexed: true, comment: '' }
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Database discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to discover database tables' },
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


