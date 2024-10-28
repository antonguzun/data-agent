import { NextResponse } from 'next/server';
import { createDataSourceConnection } from '@/libs/DataSourceConnection';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    var db;
    try {
        db = await createDataSourceConnection(params.id);
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to make connection during datasource test', details: errorMessage },
            { status: 500 }
          );
    }

    try {
        const [data] = await db.execute("SELECT 1");
        console.log(data);
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch test source', details: errorMessage },
            { status: 500 }
          );
          } finally {
        await db.end();
    }
}


