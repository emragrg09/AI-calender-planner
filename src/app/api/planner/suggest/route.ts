import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions } from '@/lib/planner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, tasks, preferences, startDate } = body;

    if (!tasks || !preferences || !startDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: tasks, preferences, and startDate are required.' },
        { status: 400 }
      );
    }

    const result = generateAISuggestions(
      events || [],
      tasks,
      preferences,
      startDate
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/planner/suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan suggestions: ' + error.message },
      { status: 500 }
    );
  }
}
