import { getServiceSupabase } from './supabase'

interface PainCrowdsourcePayload {
  anon_id: string
  diagnosis: string
  timestamp: string
  initial_pain_score: number
  source: 'painoptix'
}

export async function syncToPainCrowdsource(assessmentId: string) {
  const supabase = getServiceSupabase()
  let syncRecord: any = null
  
  try {
    // Get sync record
    const { data, error: syncError } = await supabase
      .from('paincrowdsource_sync_queue')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single()
    
    syncRecord = data
    
    if (syncError || !syncRecord) {
      throw new Error('Sync record not found')
    }

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      throw new Error('Assessment not found')
    }
    
    // Prepare payload for PainCrowdsource
    const payload: PainCrowdsourcePayload = {
      anon_id: syncRecord.anon_id,
      diagnosis: assessment.guide_type,
      timestamp: assessment.created_at,
      initial_pain_score: assessment.initial_pain_score,
      source: 'painoptix'
    }
    
    // TODO: Replace with actual PainCrowdsource API endpoint
    const PAINCROWDSOURCE_API_URL = process.env.PAINCROWDSOURCE_API_URL || 'https://paincrowdsource.org/api'
    const PAINCROWDSOURCE_API_KEY = process.env.PAINCROWDSOURCE_API_KEY || ''
    
    console.log('Would sync to PainCrowdsource:', payload)
    
    // Uncomment when API is ready
    /*
    const response = await fetch(`${PAINCROWDSOURCE_API_URL}/painoptix-enrollment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAINCROWDSOURCE_API_KEY}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }
    */
    
    // Mark as synced
    await supabase
      .from('paincrowdsource_sync_queue')
      .update({
        status: 'synced',
        synced_at: new Date().toISOString()
      })
      .eq('id', syncRecord.id)
    
    return true
  } catch (error: any) {
    console.error('PainCrowdsource sync error:', error)
    
    // Update sync record with error
    await supabase
      .from('paincrowdsource_sync_queue')
      .update({
        status: 'failed',
        sync_attempts: syncRecord.sync_attempts + 1,
        last_attempt_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('assessment_id', assessmentId)
    
    return false
  }
}