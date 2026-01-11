interface GuideTemplateParams {
  guideType: string
  assessmentId: string
  firstName?: string
  relievingFactors?: string
  aggravatingFactors?: string
}

const guideDisplayNames: Record<string, string> = {
  'sciatica': 'Sciatica',
  'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy', 
  'si_joint_dysfunction': 'SI Joint Dysfunction',
  'canal_stenosis': 'Spinal Canal Stenosis',
  'central_disc_bulge': 'Central Disc Bulge',
  'facet_arthropathy': 'Facet Joint Arthropathy',
  'muscular_nslbp': 'Muscular/Non-Specific Low Back Pain',
  'lumbar_instability': 'Lumbar Instability',
  'urgent_symptoms': 'Urgent Symptoms Requiring Medical Attention'
}

// Bradley's diagnosis-specific content
const diagnosisContent: Record<string, {
  pattern: string
  meaning: string
  successRate: string
  nextSteps: string[]
  provenResults: string
}> = {
  'sciatica': {
    pattern: 'Your reported sharp pain radiating down one leg, possibly with numbness or tingling, aligns with sciatica, often caused by a lumbar disc pressing on a nerve root.',
    meaning: 'This pattern suggests nerve irritation, commonly at L4-L5 or L5-S1, but it\'s not a diagnosis—only a healthcare provider can confirm the cause through a clinical evaluation. Good news: Research shows 70–80% of people with sciatica improve with conservative care, like specific exercises and posture adjustments [].',
    successRate: '70–80%',
    nextSteps: [
      'Explore Relief Options: Choose a tailored tool below to manage your symptoms effectively.',
      'Join PainCrowdsource.org: Log your symptoms, see what works for others (e.g., 60% pain reduction with exercises []), and contribute to better solutions.',
      'Consult a Provider: If pain, numbness, or weakness worsens, see a doctor promptly, especially for signs like loss of bowel/bladder control.'
    ],
    provenResults: 'Users report 60% pain reduction in 3 weeks with exercises like nerve glides [].'
  },
  'central_disc_bulge': {
    pattern: 'Your reported low back pain with bilateral leg discomfort, worsened by sitting and relieved by standing/walking, aligns with a pattern often linked to a central disc bulge or degeneration that may stress the spinal canal and nerves.',
    meaning: 'This pattern suggests possible nerve irritation from a disc bulge, but it\'s not a diagnosis—only a healthcare provider can confirm the cause. Research shows 70–80% of people with similar symptoms improve with conservative care, like extension exercises []. Be vigilant for urgent signs like bladder dysfunction, which may indicate cauda equina syndrome [].',
    successRate: '70–80%',
    nextSteps: [
      'Explore Relief Options: Choose a tool below to manage your symptoms and track progress.',
      'Join PainCrowdsource.org: Log your symptoms, see what works (e.g., 60% pain reduction with prone press-ups []), and contribute to better solutions.',
      'Consult a Provider: Seek immediate care if you notice new numbness, weakness, or bowel/bladder issues.'
    ],
    provenResults: 'Users report 60% pain reduction in 3 weeks with prone press-ups [].'
  },
  'facet_arthropathy': {
    pattern: 'Your reported back pain, worse with standing or arching and better with sitting, suggests involvement of the small joints in your spine (facets), a common cause of mechanical pain.',
    meaning: 'This pattern points to possible facet joint irritation, but it\'s not a diagnosis—only a healthcare provider can confirm the cause. Research shows 60–70% of people with facet-related pain improve with conservative care, like targeted stretches and posture adjustments [].',
    successRate: '60–70%',
    nextSteps: [
      'Explore Relief Options: Choose a tool below to manage your symptoms effectively.',
      'Join PainCrowdsource.org: Log your symptoms, see what works for others, and contribute to better facet pain solutions.',
      'Consult a Provider: If pain persists or worsens, see a doctor, especially for new symptoms like numbness or weakness.'
    ],
    provenResults: 'Users report significant relief with targeted stretches in 2–3 weeks [].'
  },
  'si_joint_dysfunction': {
    pattern: 'Your reported lower back and buttock pain, possibly worse with sitting or twisting, points toward sacroiliac (SI) joint irritation, a common and often underdiagnosed cause.',
    meaning: 'This pattern suggests SI joint dysfunction, but it\'s not a diagnosis—only a healthcare provider can confirm the cause. Research shows 65–75% of people with SI joint pain improve with conservative care, like specific stretches and stabilization exercises [].',
    successRate: '65–75%',
    nextSteps: [
      'Explore Relief Options: Choose a tool below to manage your symptoms effectively.',
      'Join PainCrowdsource.org: Log your symptoms, see what works for others, and contribute to better SI joint solutions.',
      'Consult a Provider: If pain persists or new symptoms (e.g., leg numbness) appear, see a doctor promptly.'
    ],
    provenResults: 'Users report 65% pain reduction with stabilization exercises in 3 weeks [].'
  }
}

export function getEducationalGuideEmailTemplate(params: GuideTemplateParams) {
  const { guideType, assessmentId, firstName = '[First Name]', relievingFactors, aggravatingFactors } = params
  const guideName = guideDisplayNames[guideType] || 'Educational Guide'
  const guideUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guide/${assessmentId}`
  
  // Get diagnosis-specific content or use defaults
  const content = diagnosisContent[guideType] || {
    pattern: `Your reported symptoms align with patterns often associated with ${guideName}.`,
    meaning: 'This pattern suggests a specific condition, but it\'s not a diagnosis—only a healthcare provider can confirm the cause through evaluation.',
    successRate: '60–80%',
    nextSteps: [
      'Explore Relief Options: Choose a tool below to manage your symptoms.',
      'Join PainCrowdsource.org: Track your progress and learn from others.',
      'Consult a Provider: See a doctor if symptoms worsen or new symptoms appear.'
    ],
    provenResults: 'Users report significant improvement with targeted exercises.'
  }
  
  const subject = 'PainFinder™: Your Personalized Back Pain Insights'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .cta-button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
        .cta-primary { background-color: #2563eb; color: white; }
        .cta-secondary { background-color: #16a34a; color: white; }
        .cta-premium { background-color: #7c3aed; color: white; }
        .tier-box { border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .discount { color: #dc2626; font-weight: bold; }
        .disclaimer { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #2563eb; margin: 0;">PainFinder™: Your Personalized Back Pain Insights</h1>
        <p style="margin: 10px 0 0 0; color: #666;">Powered by DrCPainMD.com</p>
      </div>
      
      <p>Dear ${firstName},</p>
      
      <p>Thank you for completing the PainFinder™ quiz to understand your back pain better. Based on your responses, here's what we found:</p>
      
      <h2 style="color: #1f2937;">Your Pain Pattern:</h2>
      <p style="background-color: #eff6ff; padding: 15px; border-radius: 6px; font-style: italic;">
        "${content.pattern.replace('{{relievingFactors}}', relievingFactors || 'certain positions')}"
      </p>
      
      <h2 style="color: #1f2937;">What This Means:</h2>
      <p>${content.meaning}</p>
      
      <h2 style="color: #1f2937;">Your Next Steps:</h2>
      <ol>
        ${content.nextSteps.map(step => `<li>${step}</li>`).join('')}
      </ol>
      
      <div class="disclaimer">
        <p style="margin: 0;"><strong>Important:</strong> This information is educational and does not replace medical advice. Consult a healthcare provider for a diagnosis and personalized care plan.</p>
      </div>
      
      <p style="font-weight: bold; font-size: 18px;">Take Action Now: Discover evidence-based strategies to relieve your ${guideName.toLowerCase()} with our tools below.</p>
      
      <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
      
      <h2 style="color: #1f2937; text-align: center;">Ready to Ease Your ${guideName}? Choose Your Relief Plan</h2>
      
      <p style="text-align: center;">With PainFinder™, you're steps away from moving freely again. Pick the option that fits you:</p>
      
      <div class="tier-box">
        <h3 style="color: #16a34a; margin-top: 0;">$5 Enhanced Report <span class="discount">(Was $7 – 28% Off for First 1,000 Users!)</span></h3>
        <p>Learn what ${guideName.toLowerCase()} means for you, get daily relief tips (e.g., avoiding prolonged sitting), and follow a 7-day starter plan to reduce pain.</p>
        <div style="text-align: center;">
          <a href="${guideUrl}/upgrade?tier=enhanced" class="cta-button cta-secondary">Get My Report Now</a>
        </div>
      </div>
      
      <div class="tier-box">
        <h3 style="color: #7c3aed; margin-top: 0;">$20 Comprehensive Monograph</h3>
        <p>Access a physician-written guide by Dr. Carpentier, detailing ${guideName.toLowerCase()} causes, red flags, treatments (e.g., exercises with ${content.successRate} success rate []), imaging advice, and a 14-day tracker. Includes free PainCrowdsource.org access to learn from others.</p>
        <div style="text-align: center;">
          <a href="${guideUrl}/upgrade?tier=monograph" class="cta-button cta-premium">Unlock My Monograph</a>
        </div>
      </div>
      
      <div class="tier-box" style="border-color: #2563eb;">
        <h3 style="color: #2563eb; margin-top: 0;">$250 Telehealth Consult</h3>
        <p>Book a one-on-one video call with Dr. Carpentier to confirm your ${guideName.toLowerCase()} pattern, customize your recovery plan, and address urgent concerns. Limited spots!</p>
        <div style="text-align: center;">
          <a href="https://drcpainmd.com/booking" class="cta-button cta-primary">Schedule My Consult</a>
        </div>
      </div>
      
      <h3 style="color: #1f2937;">Why Act Now?</h3>
      <ul>
        <li><strong>Launch Offer:</strong> $5 report discount ends soon!</li>
        <li><strong>Community Impact:</strong> Join PainCrowdsource.org to track progress and help refine ${guideName.toLowerCase()} solutions.</li>
        <li><strong>Proven Results:</strong> ${content.provenResults}</li>
      </ul>
      
      <div class="disclaimer">
        <p style="margin: 0;"><strong>Disclaimer:</strong> These tools are educational and do not diagnose or treat medical conditions. Consult a healthcare provider before starting any plan.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${guideUrl}" class="cta-button cta-primary">View Your Free Guide First</a>
        <a href="https://paincrowdsource.org" class="cta-button cta-secondary">Join PainCrowdsource</a>
      </div>
      
      <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
      
      <div style="text-align: center; font-size: 12px; color: #666;">
        <p>Powered by PainFinder™ and DrCPainMD.com | HIPAA-Compliant Data Handling</p>
        <p>You're receiving this email because you completed a PainOptix assessment.</p>
        <p>To delete your data, visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/delete-my-data">this link</a>.</p>
        <p>&copy; ${new Date().getFullYear()} PainOptix™. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
PainFinder™: Your Personalized Back Pain Insights
Powered by DrCPainMD.com

Dear ${firstName},

Thank you for completing the PainFinder™ quiz to understand your back pain better. Based on your responses, here's what we found:

YOUR PAIN PATTERN:
"${content.pattern.replace('{{relievingFactors}}', relievingFactors || 'certain positions')}"

WHAT THIS MEANS:
${content.meaning}

YOUR NEXT STEPS:
${content.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

IMPORTANT: This information is educational and does not replace medical advice. Consult a healthcare provider for a diagnosis and personalized care plan.

Take Action Now: Discover evidence-based strategies to relieve your ${guideName.toLowerCase()} with our tools below.

----------------------------------------

READY TO EASE YOUR ${guideName.toUpperCase()}? CHOOSE YOUR RELIEF PLAN

With PainFinder™, you're steps away from moving freely again. Pick the option that fits you:

$5 ENHANCED REPORT (Was $7 – 28% Off for First 1,000 Users!)
Learn what ${guideName.toLowerCase()} means for you, get daily relief tips, and follow a 7-day starter plan.
Get My Report Now: ${guideUrl}/upgrade?tier=enhanced

$20 COMPREHENSIVE MONOGRAPH
Access a physician-written guide by Dr. Carpentier with ${content.successRate} success rate.
Unlock My Monograph: ${guideUrl}/upgrade?tier=monograph

$250 TELEHEALTH CONSULT
Book a one-on-one video call with Dr. Carpentier. Limited spots!
Schedule My Consult: https://drcpainmd.com/booking

WHY ACT NOW?
- Launch Offer: $5 report discount ends soon!
- Community Impact: Join PainCrowdsource.org
- Proven Results: ${content.provenResults}

DISCLAIMER: These tools are educational and do not diagnose or treat medical conditions.

View Your Free Guide First: ${guideUrl}
Join PainCrowdsource: https://paincrowdsource.org

Powered by PainFinder™ and DrCPainMD.com | HIPAA-Compliant Data Handling

To delete your data: ${process.env.NEXT_PUBLIC_APP_URL}/delete-my-data
© ${new Date().getFullYear()} PainOptix™. All rights reserved.
  `.trim()
  
  return { subject, html, text }
}

export function getSMSTemplate(params: GuideTemplateParams) {
  const { guideType, assessmentId } = params
  const guideName = guideDisplayNames[guideType] || 'Educational Guide'
  const guideUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guide/${assessmentId}`
  
  return `PainFinder: Your personalized ${guideName} guide is ready! Access your full report here for FREE: ${guideUrl} Reply STOP to unsubscribe.`
}