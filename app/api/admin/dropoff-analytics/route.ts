import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr';
import { Questions } from '@/types/algorithm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Method 1: Try Supabase Auth first
    const { supabase } = await createSupabaseRouteHandlerClient(request);

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    let isAuthenticated = false;
    let isAdmin = false;

    if (session?.user) {
      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_role === 'admin') {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // Method 2: Fallback to simple password check if Supabase auth fails
    if (!isAuthenticated) {
      // Check for admin password in header as fallback
      const authHeader = request.headers.get('x-admin-password');
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // If still not authenticated, return 401
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseService = getServiceSupabase();

    // Get sessions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all sessions
    const { data: sessions, error: sessionsError } = await supabaseService
      .from('assessment_sessions')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

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

    const stats = {
      totalStarted,
      totalCompleted,
      dropoffRate,
      averageDropoffQuestion,
      dropoffsByQuestion,
      recentDropoffs,
      problemQuestions: [], // Could be expanded
      peakDropoffTimes: []  // Could be expanded
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}