import { NextResponse } from 'next/server';
import { createDatabaseOperations } from '@/interfaces/TableDefinition';

interface TableInfoResponse {
    showCreateTable: string;
}


export async function GET(
    request: Request,
    { params }: { params: { id: string; tableName: string } }
): Promise<NextResponse<TableInfoResponse | { error: string; details?: string }>> {
    let dbOps;
    try {
        dbOps = await createDatabaseOperations(params.id);
        await dbOps.init();

        const tableInfo = await dbOps.fetchTableDefinition(params.tableName);

        return NextResponse.json({ showCreateTable: tableInfo }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error fetching table info:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Database error', details: errorMessage },
            { status: 500 }
        );
    } finally {
        if (dbOps) {
            await dbOps.close();
        }
    }
}


