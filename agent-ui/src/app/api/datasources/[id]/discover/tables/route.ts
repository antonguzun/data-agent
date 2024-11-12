import { NextResponse } from 'next/server';
import { createDatabaseOperations } from '@/interfaces/TableDefinition';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    let dbOps;
    try {

        dbOps = await createDatabaseOperations(params.id);
        await dbOps.init();
        
        const tables = await dbOps.fetchTableList();
        return NextResponse.json({ tableNames: tables }, { status: 200 });
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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


