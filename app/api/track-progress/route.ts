import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();
    const {
      sessionId,
      questionId,
      questionNumber,
      questionText,
      answer,
      isStarting,
      userAgent,
      referrerSource,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // If this is the start of an assessment, create the session record
    if (isStarting) {
      const { error: sessionError } = await supabase
        .from("assessment_sessions")
        .upsert(
          {
            session_id: sessionId,
            started_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            user_agent: userAgent || null,
            referrer_source: referrerSource || "organic",
            total_questions: 0,
            questions_answered: 0,
          },
          {
            onConflict: "session_id",
          },
        );

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 },
        );
      }
    }

    // Track the question progress
    if (questionId && questionNumber !== undefined) {
      // Insert progress record
      const { error: progressError } = await supabase
        .from("assessment_progress")
        .insert({
          session_id: sessionId,
          question_id: questionId,
          question_number: questionNumber,
          question_text: questionText,
          answer: answer || null,
          answered_at: answer ? new Date().toISOString() : null,
        });

      if (progressError) {
        console.error("Error tracking progress:", progressError);
        return NextResponse.json(
          { error: "Failed to track progress" },
          { status: 500 },
        );
      }

      // Update session info
      const { data: sessionData } = await supabase
        .from("assessment_sessions")
        .select("started_at, questions_answered")
        .eq("session_id", sessionId)
        .single();

      if (sessionData) {
        const startTime = new Date(sessionData.started_at).getTime();
        const currentTime = new Date().getTime();
        const timeSpentSeconds = Math.floor((currentTime - startTime) / 1000);

        const updateData: any = {
          last_active_at: new Date().toISOString(),
          time_spent_seconds: timeSpentSeconds,
          drop_off_question_id: questionId,
          drop_off_question_number: questionNumber,
        };

        // If answer is provided, increment questions answered
        if (answer) {
          updateData.questions_answered =
            (sessionData.questions_answered || 0) + 1;
        }

        const { error: updateError } = await supabase
          .from("assessment_sessions")
          .update(updateData)
          .eq("session_id", sessionId);

        if (updateError) {
          console.error("Error updating session:", updateError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Mark session as complete when assessment is finished
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();
    const { sessionId, assessmentId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Get final session stats
    const { data: progressData } = await supabase
      .from("assessment_progress")
      .select("question_id")
      .eq("session_id", sessionId)
      .not("answer", "is", null);

    const totalQuestions = progressData?.length || 0;

    // Update session as completed
    const { error } = await supabase
      .from("assessment_sessions")
      .update({
        completed_at: new Date().toISOString(),
        assessment_id: assessmentId || null,
        total_questions: totalQuestions,
        questions_answered: totalQuestions,
        drop_off_question_id: null,
        drop_off_question_number: null,
      })
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error completing session:", error);
      return NextResponse.json(
        { error: "Failed to complete session" },
        { status: 500 },
      );
    }

    // CRITICAL FIX: Also update all assessment_progress records with the assessment_id
    if (assessmentId) {
      const { error: progressUpdateError } = await supabase
        .from("assessment_progress")
        .update({ assessment_id: assessmentId })
        .eq("session_id", sessionId);

      if (progressUpdateError) {
        console.error("Error updating assessment_progress with assessment_id:", progressUpdateError);
        // Don't fail the request, but log the error
      } else {
        console.log(`Updated assessment_progress records for session ${sessionId} with assessment ${assessmentId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
