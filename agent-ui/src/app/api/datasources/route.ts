import { NextResponse } from 'next/server';
import { dbConnect } from '@/libs/mongodb';

export async function GET() {
  try {
    const db = await dbConnect();

    const dataSources = await db
      .collection('datasources')
      .find()
      .sort({ position: 1 })
      .toArray();
    console.log('Data sources fetched:', dataSources);
    return NextResponse.json(dataSources, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await dbConnect();
    const data = await request.json();
    const { name, type } = data;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required fields' }, { status: 400 });
    }

    let newDataSource;
    const position = await db.collection('datasources').countDocuments();

    if (type === 'sqlite') {
      const { path } = data;
      if (!path) {
        return NextResponse.json({ error: 'Path is required for SQLite databases' }, { status: 400 });
      }
      newDataSource = { name, type, path, position };
    } else {
      const { host, port, database, username, password } = data;
      if (!host || !port || !database || !username || !password) {
        return NextResponse.json({ error: 'Missing required fields for MySQL/PostgreSQL connection' }, { status: 400 });
      }
      newDataSource = { name, type, host, port, database, username, password, position };
    }
    const result = await db.collection('datasources').insertOne(newDataSource);
    console.log('Data source added:', newDataSource);
    console.log('position:', position);
    return NextResponse.json({ ...newDataSource, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add data source:', error);
    return NextResponse.json(
      { error: 'Failed to add data source', details: error.message },
      { status: 500 }
    );
  }
}
