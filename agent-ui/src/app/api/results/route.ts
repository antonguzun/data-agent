import { NextResponse } from 'next/server';
import { dbConnect } from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await dbConnect();
    const hypotheses = await db.collection('tasks').find({}).sort({ created_at: -1 }).toArray();

    return NextResponse.json(hypotheses);
  } catch (error) {
    console.error('Error fetching hypotheses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hypotheses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await dbConnect();
    const { query, datasourceIds } = await request.json();
    console.log('query', query, 'datasourceIds', datasourceIds)
    if (!query || !datasourceIds) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const tasks = {
      query,
      datasourceIds,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('tasks').insertOne(tasks);

    return NextResponse.json({ 
      hypothesisId: result.insertedId.toString(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating hypothesis:', error);
    return NextResponse.json(
      { error: 'Failed to create hypothesis' },
      { status: 500 }
    );
  }
}
