import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { dbConnect } from '@/libs/mongodb';
import { IDataSourceContext, ITable } from '@/types/DataSourceContext';
import { createDatabaseOperations, IDatabaseOperations } from '@/interfaces/TableDefinition';


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const mdb = await dbConnect();

    // Fetch datasource info
    const datasource = await mdb
      .collection('datasources')
      .findOne({ _id: new ObjectId(id) });

    if (!datasource) {
      return NextResponse.json(
        { error: 'Datasource not found' },
        { status: 404 }
      );
    }

    // Fetch context
    const contextDoc = await mdb
      .collection('datasource-contexts')
      .findOne({ _id: new ObjectId(id) });

    console.log("contextDoc", contextDoc)

    const context: IDataSourceContext = {
      _id: id,
      tables: contextDoc?.tables ? JSON.parse(contextDoc.tables) : [],
    };

    return NextResponse.json({
      name: datasource.name,
      type: datasource.type,
      context
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching context:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const context = await request.json();

    const mdb = await dbConnect();

    await mdb
      .collection('datasource-contexts')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { tables: JSON.stringify(context.tables) } },
        { upsert: true }
      );

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error updating context:', error);
    return NextResponse.json(
      {
        error: 'Failed to update context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let dbOps: IDatabaseOperations;

  try {
    const { id } = params;
    const { tableNames } = await request.json();

    if (!Array.isArray(tableNames)) {
      return NextResponse.json(
        { error: 'tableNames must be an array' },
        { status: 400 }
      );
    }

    const mdb = await dbConnect();

    dbOps = await createDatabaseOperations(params.id);
    await dbOps.init();

    const tables: ITable[] = await Promise.all(
      tableNames.map(async (tableName) => {
        const tableOutput = await dbOps.fetchTableDefinition(tableName);
        return {
          tableName,
          tableOutput,
          tableDescription: '',
          tableOutputUserDescription: ''
        };
      })
    );

    console.log("tables_to_save", tables)

    await mdb
      .collection('datasource-contexts')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { tables: JSON.stringify(tables) } },
        { upsert: true }
      );

    const context: IDataSourceContext = {
      tables,
      _id: id,
    };

    return NextResponse.json({ context }, { status: 200 });

  } catch (error) {
    console.error('Error updating context:', error);
    return NextResponse.json(
      {
        error: 'Failed to update context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
