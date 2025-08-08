import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Image 
} from '@react-pdf/renderer';
import {
  interpretPainLocation,
  interpretPainTriggers,
  interpretFunctionalTests,
  generatePersonalizedExercises,
  calculateSeverityScore,
  getTimelineEstimate,
  getWorkplaceModifications,
  getSleepPositionRecommendations,
  formatResponsesForDisclosure
} from '../pdf-helpers';

// Register professional fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #0B5394',
    paddingBottom: 20
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0B5394',
    marginBottom: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#212529',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 5
  },
  doctorName: {
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: 600
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#0B5394',
    marginBottom: 10
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0B5394',
    marginBottom: 8,
    marginTop: 10
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#212529',
    marginBottom: 10,
    textAlign: 'justify'
  },
  list: {
    marginLeft: 20,
    marginBottom: 10
  },
  listItem: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#212529',
    marginBottom: 5
  },
  highlightBox: {
    backgroundColor: '#F0F9FF',
    borderLeft: '3 solid #0B5394',
    padding: 15,
    marginVertical: 10
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderLeft: '3 solid #F59E0B',
    padding: 15,
    marginVertical: 10
  },
  urgentBox: {
    backgroundColor: '#FEE2E2',
    borderLeft: '3 solid #DC2626',
    padding: 15,
    marginVertical: 10
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0B5394',
    marginBottom: 5
  },
  assessmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  assessmentItem: {
    flex: 1,
    marginRight: 10
  },
  assessmentLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2
  },
  assessmentValue: {
    fontSize: 12,
    fontWeight: 600,
    color: '#2C3E50'
  },
  timelinePhase: {
    marginBottom: 15,
    paddingLeft: 15,
    borderLeft: '2 solid #E5E7EB'
  },
  phaseTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0B5394',
    marginBottom: 5
  },
  illustrationPlaceholder: {
    backgroundColor: '#F3F4F6',
    height: 120,
    marginVertical: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#9CA3AF'
  },
  illustrationText: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic'
  },
  disclaimer: {
    fontSize: 10,
    color: '#6C757D',
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginTop: 30,
    borderRadius: 4,
    borderLeft: '3 solid #0B5394'
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0B5394',
    marginBottom: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF'
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    opacity: 0.1,
    color: '#0B4F6C'
  }
});

interface GuideTemplateProps {
  guideType: string;
  tier: 'free' | 'enhanced' | 'monograph';
  patientData: {
    assessmentId: string;
    email?: string;
    disclosures: string[];
    createdAt: string;
    initialPainScore?: number;
    responses: Record<string, any>;
    questionPath: string[];
  };
  content: string;
  headerContent?: string;
  footerContent?: string;
}

export const GuideTemplate: React.FC<GuideTemplateProps> = ({
  guideType,
  tier,
  patientData,
  content,
  headerContent,
  footerContent
}) => {
  const guideTitle = guideType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const tierLabel = tier === 'monograph' ? 'Comprehensive Monograph' : 
                    tier === 'enhanced' ? 'Enhanced Guide' : 'Educational Guide';

  // Calculate severity and get personalized data
  const severity = calculateSeverityScore(patientData.responses, patientData.initialPainScore);
  const functionalTests = interpretFunctionalTests(
    patientData.responses.Q10,
    patientData.responses.Q11,
    patientData.responses.Q12
  );
  const exercises = generatePersonalizedExercises(patientData.responses);
  const timeline = getTimelineEstimate(patientData.responses, severity);
  const workMods = getWorkplaceModifications(patientData.responses);
  const sleepRecs = getSleepPositionRecommendations(patientData.responses);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for non-free tiers */}
        {tier !== 'free' && (
          <Text style={styles.watermark}>
            {tier === 'monograph' ? 'MONOGRAPH' : 'ENHANCED'}
          </Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PainOptix™</Text>
          <Text style={styles.title}>
            {guideTitle} - {tierLabel}
          </Text>
          <Text style={styles.subtitle}>
            Personalized Educational Information
          </Text>
          <Text style={styles.doctorName}>
            Designed by Bradley W. Carpentier, MD
          </Text>
        </View>

        {/* Severity Alert Box if needed */}
        {severity.urgency === 'urgent' && (
          <View style={styles.urgentBox}>
            <Text style={styles.scoreText}>⚠️ URGENT MEDICAL ATTENTION REQUIRED</Text>
            <Text style={styles.paragraph}>{severity.interpretation}</Text>
          </View>
        )}

        {/* Your Complete Pain Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Complete Pain Profile</Text>
          
          <View style={styles.assessmentGrid}>
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Pain Location</Text>
              <Text style={styles.assessmentValue}>
                {interpretPainLocation(patientData.responses.Q1)}
              </Text>
            </View>
            {patientData.initialPainScore !== undefined && (
              <View style={styles.assessmentItem}>
                <Text style={styles.assessmentLabel}>Pain Intensity</Text>
                <Text style={styles.assessmentValue}>
                  {patientData.initialPainScore}/10
                </Text>
              </View>
            )}
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Severity Assessment</Text>
              <Text style={styles.assessmentValue}>
                {severity.urgency.charAt(0).toUpperCase() + severity.urgency.slice(1)}
              </Text>
            </View>
          </View>

          {/* Pain Triggers */}
          {patientData.responses.Q2 && patientData.responses.Q2.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>What Makes Your Pain Worse</Text>
              <View style={styles.list}>
                {interpretPainTriggers(patientData.responses.Q2).map((trigger, index) => (
                  <Text key={index} style={styles.listItem}>• {trigger}</Text>
                ))}
              </View>
            </>
          )}

          {/* Pain Pattern */}
          {patientData.responses.Q3 && (
            <Text style={styles.paragraph}>
              Pain timing: {
                patientData.responses.Q3 === 'morning' ? 'Worse in the morning after rest' :
                patientData.responses.Q3 === 'end_of_day' ? 'Worse at the end of the day after activity' :
                'Not tied to specific time of day'
              }
            </Text>
          )}
        </View>

        {/* Functional Assessment Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Functional Assessment Results</Text>
          
          <View style={styles.highlightBox}>
            <Text style={styles.subsectionTitle}>Movement Testing Summary</Text>
            <Text style={styles.paragraph}>• Forward Bending: {functionalTests.flexibility}</Text>
            <Text style={styles.paragraph}>• Back Extension: {functionalTests.spinalMobility}</Text>
            <Text style={styles.paragraph}>• Neurological Function: {functionalTests.neurologicalSigns}</Text>
          </View>

          {functionalTests.implications.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>What These Results Mean</Text>
              <View style={styles.list}>
                {functionalTests.implications.map((implication, index) => (
                  <Text key={index} style={styles.listItem}>• {implication}</Text>
                ))}
              </View>
            </>
          )}

          {/* TODO: Insert Bradley's line-art illustration for functional test positions */}
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationText}>
              [Placeholder for Bradley&apos;s functional test illustration]
            </Text>
          </View>
        </View>

        {/* Tier-specific content begins here */}
        {tier !== 'free' && (
          <>
            {/* Personalized Exercise Program */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Personalized Exercise Program</Text>
              
              <Text style={styles.subsectionTitle}>Recommended Exercises</Text>
              <View style={styles.list}>
                {exercises.recommended.map((exercise, index) => (
                  <Text key={index} style={styles.listItem}>• {exercise}</Text>
                ))}
              </View>

              {exercises.avoid.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Exercises to Avoid Initially</Text>
                  <View style={styles.warningBox}>
                    {exercises.avoid.map((avoid, index) => (
                      <Text key={index} style={styles.listItem}>• {avoid}</Text>
                    ))}
                  </View>
                </>
              )}

              {exercises.modifications.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Important Modifications</Text>
                  <View style={styles.list}>
                    {exercises.modifications.map((mod, index) => (
                      <Text key={index} style={styles.listItem}>• {mod}</Text>
                    ))}
                  </View>
                </>
              )}

              {/* TODO: Insert Bradley's line-art illustration for recommended exercises */}
              <View style={styles.illustrationPlaceholder}>
                <Text style={styles.illustrationText}>
                  [Placeholder for Bradley&apos;s exercise illustration]
                </Text>
              </View>
            </View>

            {/* Recovery Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Expected Recovery Timeline</Text>
              
              <View style={styles.timelinePhase}>
                <Text style={styles.phaseTitle}>Phase 1: {timeline.phase1.duration}</Text>
                {timeline.phase1.goals.map((goal, index) => (
                  <Text key={index} style={styles.listItem}>• {goal}</Text>
                ))}
              </View>

              <View style={styles.timelinePhase}>
                <Text style={styles.phaseTitle}>Phase 2: {timeline.phase2.duration}</Text>
                {timeline.phase2.goals.map((goal, index) => (
                  <Text key={index} style={styles.listItem}>• {goal}</Text>
                ))}
              </View>

              <View style={styles.timelinePhase}>
                <Text style={styles.phaseTitle}>Phase 3: {timeline.phase3.duration}</Text>
                {timeline.phase3.goals.map((goal, index) => (
                  <Text key={index} style={styles.listItem}>• {goal}</Text>
                ))}
              </View>

              {timeline.warnings.length > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.subsectionTitle}>Important Considerations</Text>
                  {timeline.warnings.map((warning, index) => (
                    <Text key={index} style={styles.listItem}>• {warning}</Text>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Monograph-specific content */}
        {tier === 'monograph' && (
          <>
            {/* Workplace Modifications */}
            {workMods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workplace Modifications for Your Condition</Text>
                <View style={styles.list}>
                  {workMods.map((mod, index) => (
                    <Text key={index} style={styles.listItem}>• {mod}</Text>
                  ))}
                </View>
                
                {/* TODO: Insert Bradley's line-art illustration for ergonomic setup */}
                <View style={styles.illustrationPlaceholder}>
                  <Text style={styles.illustrationText}>
                    [Placeholder for Bradley&apos;s workplace ergonomics illustration]
                  </Text>
                </View>
              </View>
            )}

            {/* Sleep Position Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Position Recommendations</Text>
              
              <Text style={styles.subsectionTitle}>Recommended Positions</Text>
              <View style={styles.list}>
                {sleepRecs.positions.map((pos, index) => (
                  <Text key={index} style={styles.listItem}>• {pos}</Text>
                ))}
              </View>

              {sleepRecs.avoid.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Positions to Avoid</Text>
                  <View style={styles.list}>
                    {sleepRecs.avoid.map((avoid, index) => (
                      <Text key={index} style={styles.listItem}>• {avoid}</Text>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.subsectionTitle}>Sleep Tips</Text>
              <View style={styles.list}>
                {sleepRecs.tips.map((tip, index) => (
                  <Text key={index} style={styles.listItem}>• {tip}</Text>
                ))}
              </View>

              {/* TODO: Insert Bradley's line-art illustration for sleep positions */}
              <View style={styles.illustrationPlaceholder}>
                <Text style={styles.illustrationText}>
                  [Placeholder for Bradley&apos;s sleep position illustration]
                </Text>
              </View>
            </View>

            {/* Weekly Progress Tracking */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Progress Benchmarks</Text>
              <Text style={styles.paragraph}>
                Based on your specific presentation, here are benchmarks to track your progress:
              </Text>
              
              <View style={styles.highlightBox}>
                <Text style={styles.subsectionTitle}>Week 1-2</Text>
                <Text style={styles.listItem}>• Pain reduction of 20-30% expected</Text>
                <Text style={styles.listItem}>• Ability to perform daily activities with less discomfort</Text>
                <Text style={styles.listItem}>• Improved sleep quality</Text>
              </View>

              <View style={styles.highlightBox}>
                <Text style={styles.subsectionTitle}>Week 3-4</Text>
                <Text style={styles.listItem}>• 50% improvement in pain levels</Text>
                <Text style={styles.listItem}>• Return to light exercise/walking</Text>
                <Text style={styles.listItem}>• Reduced medication needs</Text>
              </View>

              <View style={styles.highlightBox}>
                <Text style={styles.subsectionTitle}>Week 5-6</Text>
                <Text style={styles.listItem}>• 70-80% recovery expected</Text>
                <Text style={styles.listItem}>• Return to most normal activities</Text>
                <Text style={styles.listItem}>• Focus shifts to prevention</Text>
              </View>
            </View>
          </>
        )}

        {/* Educational Content from Bradley's PDFs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Educational Information: {guideTitle}</Text>
          {/* Parse and render markdown content as PDF */}
          {content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('#')) {
              const matchResult = paragraph.match(/^#+/);
              const level = matchResult ? matchResult[0].length : 1;
              const text = paragraph.replace(/^#+\s/, '');
              return (
                <Text key={index} style={level === 1 ? styles.sectionTitle : styles.subsectionTitle}>
                  {text}
                </Text>
              );
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
              const items = paragraph.split('\n');
              return (
                <View key={index} style={styles.list}>
                  {items.map((item, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {item.replace(/^[*-]\s/, '')}
                    </Text>
                  ))}
                </View>
              );
            } else {
              return (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              );
            }
          })}
        </View>

        {/* Transparency Disclosure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Input Summary</Text>
          <Text style={styles.paragraph}>
            This educational guide was generated based on the following information you provided:
          </Text>
          <View style={styles.list}>
            {formatResponsesForDisclosure(patientData.responses).slice(0, 10).map((disclosure, index) => (
              <Text key={index} style={styles.listItem}>• {disclosure}</Text>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This educational guide is for informational purposes only and does not constitute medical advice. 
          Always consult with qualified healthcare professionals for medical concerns. 
          The information provided is based on your self-reported symptoms and should not replace 
          professional medical evaluation. Individual results may vary.
        </Text>

        {/* Footer */}
        <Text style={styles.footer}>
          PainOptix Educational Guide | Assessment ID: {patientData.assessmentId} | 
          Generated: {new Date(patientData.createdAt).toLocaleDateString()} | 
          © Bradley W. Carpentier, MD
        </Text>
      </Page>
    </Document>
  );
};