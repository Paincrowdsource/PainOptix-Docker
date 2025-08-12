import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAuth, logAdminAction } from '@/lib/middleware/admin-auth';
import { logger } from '@/lib/logger';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(req);
    
    const { id: assessmentId } = await params;
    
    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID required' },
        { status: 400 }
      );
    }

    // Get assessment details before deletion for audit log
    const supabase = supabaseAdmin();
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select('email, phone_number, guide_type')
      .eq('id', assessmentId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch assessment for deletion', { 
        error: fetchError,
        assessmentId,
        adminId: admin.id
      });
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Delete the assessment (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId);

    if (deleteError) {
      logger.error('Failed to delete assessment', { 
        error: deleteError,
        assessmentId,
        adminId: admin.id
      });
      return NextResponse.json(
        { error: 'Failed to delete assessment' },
        { status: 500 }
      );
    }

    // Log the admin action
    await logAdminAction(
      admin.id,
      'delete_assessment',
      'assessment',
      assessmentId,
      {
        email: assessment.email,
        phone_number: assessment.phone_number,
        guide_type: assessment.guide_type,
        deleted_by_email: admin.email
      },
      req
    );

    logger.info('Assessment deleted by admin', {
      assessmentId,
      adminId: admin.id,
      adminEmail: admin.email
    });

    return NextResponse.json({ 
      success: true,
      message: 'Assessment deleted successfully' 
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    logger.error('Error in DELETE /api/admin/assessments/[id]/delete', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}