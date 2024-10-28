import { NextResponse } from 'next/server';
import { dbConnect } from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await dbConnect();
    console.log('try to find datasource:', params.id);

    const dataSource = await db
      .collection('datasources')
      .findOne({ _id: new ObjectId(params.id) });
    console.log('dataSource by id:', dataSource);

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json(dataSource, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources', details: error.message },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const db = await dbConnect();

    const result = await db.collection('datasources').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Data source removed successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to remove data source', details: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const db = await dbConnect();

    const { position } = await request.json();

    if (position == null) {
      return NextResponse.json({ error: 'Position is required' }, { status: 400 });
    }

    const result = await db
      .collection('datasources')
      .updateOne({ _id: new ObjectId(id) }, { $set: { position } });

    if (result.matchedCount === 1) {
      return NextResponse.json({ message: 'Position updated successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update position', details: error.message },
      { status: 500 }
    );
  }
}


