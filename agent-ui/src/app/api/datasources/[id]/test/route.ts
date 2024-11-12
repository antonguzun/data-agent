import { NextResponse } from 'next/server';
import { createDatabaseOperations } from '@/interfaces/TableDefinition';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    var dbOps;
    try {
        dbOps = await createDatabaseOperations(params.id);
        await dbOps.init();
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to make connection during datasource test', details: errorMessage },
            { status: 500 }
        );
    }

    try {
        await dbOps.testConnection();
        return NextResponse.json({}, { status: 200 });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch test source', details: errorMessage },
            { status: 500 }
        );
    } finally {
        await dbOps.close();
    }
}


