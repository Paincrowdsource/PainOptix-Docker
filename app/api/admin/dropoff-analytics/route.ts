import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/admin/auth';
import { Questions } from '@/types/algorithm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseService = getServiceSupabase();

    // Compute date cutoff from timePeriod query param
    const timePeriod = request.nextUrl.searchParams.get('timePeriod') || '30d';
    const now = new Date();
    let dateCutoff: string | null = null;
    switch (timePeriod) {
      case '90d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        dateCutoff = d.toISOString();
        break;
      }
      case 'ytd':
        dateCutoff = `${now.getFullYear()}-01-01T00:00:00Z`;
        break;
      case 'all':
        dateCutoff = null;
        break;
      default: {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        dateCutoff = d.toISOString();
        break;
      }
    }

    // Get all sessions for the selected time period
    let sessionsQuery = supabaseService
      .from('assessment_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (dateCutoff) {
      sessionsQuery = sessionsQuery.gte('created_at', dateCutoff);
    }
    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // Get assessment progress for drop-off analysis
    const incompleteSessions = sessions?.filter(s => s.completed_at === null) || [];
    const sessionIds = incompleteSessions.map(s => s.session_id);

    let progressData: any[] = [];
    if (sessionIds.length > 0) {
      const { data: progress, error: progressError } = await supabaseService
        .from('assessment_progress')
        .select('session_id, question_id, question_text, question_number')
        .in('session_id', sessionIds);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      } else {
        progressData = progress || [];
      }
    }

    // Build drop-off stats
    const totalStarted = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completed_at !== null) || [];
    const totalCompleted = completedSessions.length;
    const dropoffRate = totalStarted > 0 ? ((totalStarted - totalCompleted) / totalStarted * 100) : 0;

    // Calculate average drop-off question
    const dropoffQuestions = incompleteSessions
      .filter(s => s.drop_off_question_number !== null)
      .map(s => s.drop_off_question_number);
    const averageDropoffQuestion = dropoffQuestions.length > 0
      ? Math.round(dropoffQuestions.reduce((a, b) => a + b, 0) / dropoffQuestions.length)
      : 0;

    // Get drop-offs by question
    const dropoffMap = new Map<string, { count: number; questionNumber: number; questionText: string }>();

    for (const session of incompleteSessions) {
      if (session.drop_off_question_id) {
        const key = session.drop_off_question_id;
        if (!dropoffMap.has(key)) {
          // Find question text from progress data
          const progressRecord = progressData.find(
            p => p.session_id === session.session_id && p.question_id === session.drop_off_question_id
          );

          dropoffMap.set(key, {
            count: 0,
            questionNumber: session.drop_off_question_number || 0,
            questionText: progressRecord?.question_text
              || Questions[session.drop_off_question_id as keyof typeof Questions]?.text
              || Questions[`Q${session.drop_off_question_number}` as keyof typeof Questions]?.text
              || 'Unknown Question'
          });
        }
        const current = dropoffMap.get(key)!;
        current.count++;
      }
    }

    const dropoffsByQuestion = Array.from(dropoffMap.entries())
      .map(([questionId, data]) => ({
        questionId,
        questionNumber: data.questionNumber,
        dropoffs: data.count,
        questionText: data.questionText
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber);

    // Get recent drop-offs
    const recentDropoffs = incompleteSessions.slice(0, 50).map(session => ({
      id: session.id,
      sessionId: session.session_id,
      startTime: session.started_at,
      lastActive: session.last_active_at,
      questionsAnswered: session.questions_answered || 0,
      dropoffQuestion: session.drop_off_question_id,
      dropoffQuestionNumber: session.drop_off_question_number,
      timeSpent: session.time_spent_seconds || 0
    }));

    // Compute problem questions (>15% drop-off rate)
    const problemQuestions = totalStarted > 0
      ? dropoffsByQuestion.filter(q => (q.dropoffs / totalStarted * 100) > 15)
      : [];

    // Compute peak drop-off times by hour of day
    const hourCounts = new Map<number, number>();
    for (const session of incompleteSessions) {
      const ts = session.last_active_at || session.started_at;
      if (ts) {
        const hour = new Date(ts).getUTCHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    }
    const peakDropoffTimes = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hour,
        timeLabel: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stats = {
      totalStarted,
      totalCompleted,
      dropoffRate,
      averageDropoffQuestion,
      dropoffsByQuestion,
      recentDropoffs,
      problemQuestions,
      peakDropoffTimes,
      timePeriod
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}