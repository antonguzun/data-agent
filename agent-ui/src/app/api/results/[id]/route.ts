import { NextResponse } from 'next/server';
import { dbConnect } from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await dbConnect();
    const hypothesis = await db
      .collection('tasks')
      .findOne({ _id: new ObjectId(params.id) });

    if (!hypothesis) {
      return NextResponse.json(
        { error: 'Hypothesis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(hypothesis);
  } catch (error) {
    console.error('Error fetching hypothesis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hypothesis' },
      { status: 500 }
    );
  }
}
