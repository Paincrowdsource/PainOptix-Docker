export const hp = {
  brand: { name: 'PainOptix' },
  hero: {
    title: 'Finally Understand  and Fix  Your Back Pain',
    sub: 'Take the 3-minute PainFinder check and unlock a personalized recovery guide built by a board-certified pain specialist. Limited pilot: $20 monograph for $5.',
    cta: 'Start Free Check ',
    note: 'No payment required to take the check.',
  },
  quickProof: {
    title: 'Quick Proof',
    badges: [
      { label: '16 Clinical Questions', sub: 'based on guidelines' },
      { label: '8+ Pain Conditions', sub: 'disc, sciatica, SI joint, facet, more' },
      { label: 'Physician Designed', sub: 'evidence-based education' },
    ],
  },
  howItWorks: {
    title: 'How It Works (3 minutes)',
    steps: [
      { title: 'Complete a quick assessment', body: 'Focused questions about your symptoms, triggers, and history.' },
      {
        title: 'Receive your personalized report',
        body: 'Full $20 monograph for $5 (pilot price) explaining your most likely pain source, what helps, and what to avoid.',
      },
      { title: 'Take informed action', body: 'Follow a 7-day starter plan and use the guidance to discuss options with your clinician.' },
    ],
    cta: 'Start Free Check ',
  },
  products: {
    title: 'Choose Your Personalized Guide',
    subtitle: 'Start free. Pick a report only if it helps.',
    monograph: {
      featuredLabel: 'Featured (Most Chosen)',
      name: 'Complete Recovery Monograph',
      priceNormal: '$20',
      pricePilotLabelEnv: 'NEXT_PUBLIC_PILOT_LABEL',
      oneLine: 'Physician-authored, step-by-step recovery guide.',
      includes: [
        'Everything in the Enhanced Report plus',
        '14-day movement & recovery progression',
        'Decision guides for PT, injections, and meds',
        'Imaging & treatment timing + red-flag list',
        'Printable tracker and symptom map',
      ],
      button: 'Get Complete Monograph  ',
      microcopy: 'Pilot pricing supports outcomes research. Instant download. 7-day money-back guarantee.',
    },
    enhanced: {
      name: 'Enhanced Report',
      price: '$5',
      oneLine: 'Concise summary and 7-day starter actions.',
      includes: [
        'Likely pain type explained in plain language',
        '7-day starter plan + common mistakes to avoid',
        'When to consider imaging',
      ],
      button: 'Get Enhanced Report  $5',
      microcopy: 'Delivered instantly. 7-day money-back guarantee.',
    },
    underNote: 'Your PainFinder check is free; youll only pay if you choose a guide.',
  },
  bio: {
    title: 'Created by a Physician, Not a Marketer',
    name: 'Bradley W. Carpentier, MD',
    creds: 'Board-Certified in Anesthesiology & Pain Medicine',
    quote:
      'After 25+ years in interventional pain care, I built PainOptix to help patients quickly understand whats driving their pain  and how to recover safely.',
    avatarInitials: 'BC',
  },
  testimonials: {
    strap: 'Real feedback from clinic visits to Dr. Carpentier',
    items: [
      {
        quote:
          'The team was considerate, respectful, and made me feel cared for throughout my visit. I appreciated how smoothly everything went from start to finish.',
        by: 'Mildred T.',
      },
      {
        quote:
          'Every visit has been excellent. The environment is calm, the staff is kind, and I always feel listened to and well cared for.',
        by: 'Stephanie P.',
      },
      {
        quote:
          'Always a great experience. The staff is professional and friendly, and I consistently receive quality care that helps me manage my pain.',
        by: 'David O.',
      },
      {
        quote:
          'The staff was super friendly and efficient. I barely had time to sit down before being seen, and the whole visit felt relaxed and easy.',
        by: 'Christopher H.',
      },
      {
        quote:
          'The staff and doctor are amazing. They treat every patient with compassion and make the experience as comfortable as possible.',
        by: 'Melissa E.',
      },
      {
        quote:
          "I've never felt rushed or dismissed. They put the patient first instead of the paperwork, and that makes all the difference.",
        by: 'Verified Patient',
      },
      {
        quote:
          "Dr. Carpentier took the time to explain every step of my treatment. I'm now pain-free and feel like I've been given my life back.",
        by: 'Verified Patient',
      },
      {
        quote:
          'Always a good experience here. The care has been consistent, the staff attentive, and the results have made a real difference for my back pain.',
        by: 'Robert O.',
      },
      {
        quote:
          'Dr. Carpentier and his staff are fantastic: professional, understanding, and genuinely committed to helping people get better.',
        by: 'Anonymous',
      },
    ],
    footnote: 'Patient comments reflect individual experiences; results vary. Educational content only.',
  },
  pilot: {
    title: 'Pilot Launch  Limited Release',
    body: 'Were enrolling early users to validate real-world outcomes. During this pilot, the complete $20 monograph is available for $5. Same doctor-authored content, lifetime updates, and anonymized feedback to improve future versions.',
    cta: 'Get My $5 Pilot Access ',
  },
  whatYouGet: {
    title: 'What Youll Get',
    bullets: [
      'Clear explanation of your likely pain type',
      '7-day starter plan (and 14-day progression in the monograph)',
      'What to avoid so you dont flare symptoms',
      'When imaging makes sense (and when it doesnt)',
      'Printable tracker & simple self-checks',
    ],
  },
  faqTrust: {
    title: 'Trust & FAQs',
    faqs: [
      { q: 'Why is the check free?', a: 'Good care starts with clear information.' },
      { q: 'Refund policy?', a: '7-day money-back on any purchase.' },
      { q: 'Medical disclaimer', a: 'Educational only; not a substitute for clinical care.' },
    ],
  },
  footer: {
    ctaTitle: 'Ready to Start?',
    ctaSub: 'Get your custom analysis in under 3 minutes.',
    cta: 'Start Free Check ',
    links: [
      { text: 'Privacy', href: '/privacy' },
      { text: 'Terms', href: '/terms' },
      { text: 'Medical Disclaimer', href: '/medical-disclaimer' },
    ],
  },
} as const;
