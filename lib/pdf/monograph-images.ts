// Map exercise names (as they appear in monograph text) to image files
export const exerciseImageMap: Record<string, string> = {
  // Generic mappings used across conditions
  'Knee to Chest': 'Knee_to_chest_stretch.png',
  'Single Knee to Chest': 'Knee_to_chest_stretch.png',
  'Double Knee to Chest': 'Knee_to_chest_stretch.png',
  'Bridges': 'Bridges_Pose.png',
  'Bridge': 'Bridges_Pose.png',
  'Glute Bridge': 'Bridges_Pose.png',
  'Bridges (if no worsening)': 'Bridges_Pose.png',
  'Wall Sits': 'Wall_Sits_or_Wall_Squats_82425.png',
  'Wall Sit': 'Wall_Sits_or_Wall_Squats_82425.png',
  'Wall Squats': 'Wall_Sits_or_Wall_Squats_82425.png',
  'Partial Wall Squats': 'Wall_Sits_or_Wall_Squats_82425.png',
  'Wall Sits/Squats': 'Wall_Sits_or_Wall_Squats_82425.png',
  'Step-Ups': 'Step_Ups.png',
  'Step Up': 'Step_Ups.png',
  'Step Ups': 'Step_Ups.png',
  'Cat-Cow': 'Cat_Camel_Stretch.png',
  'Cat Camel': 'Cat_Camel_Stretch.png',
  'Cat-Camel': 'Cat_Camel_Stretch.png',
  'Bird Dog': 'Bird_Dog_Exercise_82325.png',
  'Bird-Dog': 'Bird_Dog_Exercise_82325.png',
  'BirdDog': 'Birddog_pose.png',
  'Pelvic Tilt': 'Pelvic_Tilt.png',
  'Pelvic Tilts': 'Pelvic_Tilt.png',
  'Dead Bug': 'Dead_Bug_Pose.png',
  'Dead Bugs': 'Dead_Bug_Pose.png',
  'Hip Flexor Stretch': 'advanced seated hip flexor stretch.png',
  'Seated Hip Flexor Stretch': 'advanced seated hip flexor stretch.png',
  'Advanced Hip Flexor Stretch': 'advanced seated hip flexor stretch.png',
  'Standing Hip Flexion': 'Standing_Hip_Flexion.png',
  'Standing Back Extension': 'Standing_Back_Extension.png',
  'Prone Press': 'Prone_Press_Ups.png',
  'Prone Press-Up': 'Prone_Press_Ups.png',
  'Prone Press-Ups': 'Prone_Press_Ups.png',
  'Prone Press-Ups (Modified McKenzie)': 'Prone_Press_Ups.png',
  'Child\'s Pose': 'Childs_Pose.png',
  'Childs Pose': 'Childs_Pose.png',
  'Child\'s Pose Stretch': 'Childs_Pose.png',  // Fixed: use existing file
  'Single Knee-to-Chest': 'Knee_to_chest_stretch.png',  // Added missing mapping
  'Single Knee-to-Chest Stretch': 'Knee_to_chest_stretch.png',  // Added variant
  'Clamshell': 'Clamshell.png',
  'Clamshells': 'Clamshell.png',
  'Glute Squeeze': 'Glute Squeeze.png',
  'Gluteal Squeeze': 'Glute Squeeze.png',
  'Hip Hinge': 'Hip Hinge With Dowel Updated.png',
  'Hip Hinge with Dowel': 'Hip Hinge With Dowel Updated.png',
  'Modified Row': 'Modified Seated Row.png',
  'Modified Seated Row': 'Modified Seated Row.png',
  'Partial Squats': 'Partial_Squats.png',
  'Partial Squat': 'Partial_Squats.png',
  'Squats': 'Partial_Squats.png',
  'Squat': 'Partial_Squats.png',
  'Prone Lying': 'Prone_Lying.png',
  'Prone Position': 'Prone_Lying.png',
  'Seated Sciatic Nerve Glides': 'Seated_Leg_Extension.png',
  'Sciatic Nerve Glides': 'Seated_Leg_Extension.png',
  'Sit-to-Stand Drills': 'Sit to Stand Drills.png',
  'Sit-to-Stand': 'Sit to Stand Drills.png',
  'Unilateral Carries': 'Unilateral Carries.png',
  'Unilateral Carry': 'Unilateral Carries.png',
  'Seated Leg Extension': 'Seated_Leg_Extension.png',
  'Leg Extension': 'Seated_Leg_Extension.png',
  'Seated Lumbar Flexion': 'Seated_Lumbar_Flexion.png',
  'Lumbar Flexion': 'Seated_Lumbar_Flexion.png',
  'Seated Row': 'Seated_Rows.png',
  'Seated Rows': 'Seated_Rows.png',
  'Sciatic Nerve Glide': 'Seated_Leg_Extension.png',
  'Sciatic Nerve Stretch': 'Seated_Leg_Extension.png',
  'Nerve Glide': 'Seated_Leg_Extension.png',
  'Side-Lying Hip Abduction': 'Side Lying Hip Abduction.png',
  'Hip Abduction': 'Side Lying Hip Abduction.png',
  'Single Leg Stand': 'Standing_Hip_Flexion.png',
  'Single Leg Stance': 'Standing_Hip_Flexion.png',
  'Single-Leg Stand': 'Standing_Hip_Flexion.png',
  'Single leg stands': 'Standing_Hip_Flexion.png',
  'Standing Balance': 'Standing_Hip_Flexion.png',
  'Abdominal Bracing': 'Supine_Abdominal_Bracing.png',
  'Core Bracing': 'Supine_Abdominal_Bracing.png',
  'Supine Abdominal Bracing': 'Supine_Abdominal_Bracing.png',
  'Knee Rocks': 'Knee_Rocks.png',
  'Knee Rock': 'Knee_Rocks.png',  // Singular variant
  'Full Planks': 'Full_Planks.png',
  'Full Plank': 'Full_Planks.png',  // Singular variant
  'Plank Progression': 'Full_Planks.png',  // As used in muscular_nslbp
  'Modified Plank': 'Modified Plank Updated.png',  // New specific image for modified plank
  'Transverse Abdominis Activation': 'Transverse Abdominis.png',
  'Transverse Abdominis': 'Transverse Abdominis.png',
  'Dead Bug Prep': 'Dead Bug Prep.png',
  'Side-Lying Leg Lifts': 'Side Lying Leg Lifts.png',
  'Side Lying Leg Lifts': 'Side Lying Leg Lifts.png'
};

// Anatomical images by condition
export const anatomicalImagesByCondition: Record<string, string[]> = {
  // Sciatica (disc herniation/disc bulge)
  sciatica: [
    'Disc Bulge and Protrusion.png',
    'spine drawing with cord and nerves.png'
  ],
  // Central disc bulge
  central_disc_bulge: [
    'Disc Bulge and Protrusion.png',
    'spine drawing with labels.jpg'
  ],
  // Canal stenosis (spinal stenosis)
  canal_stenosis: [
    'spine drawing with cord and nerves.png',
    'spine drawing with labels.jpg'
  ],
  // Lumbar instability (spondylolisthesis)
  lumbar_instability: [
    'Drawing of listhesis and pars defect.png',
    'listhesis and pars defect detailed.jpg'
  ],
  // SI joint dysfunction
  si_joint_dysfunction: [
    'Pelvis and SI joint.jpg'
  ],
  // Facet arthropathy
  facet_arthropathy: [
    'Facet_Joint.png'
  ],
  // Muscular NSLBP
  muscular_nslbp: [],
  // Upper lumbar radiculopathy
  upper_lumbar_radiculopathy: [
    'spine drawing with cord and nerves.png'
  ],
  // Urgent symptoms
  urgent_symptoms: []
};

// Helper function to find matching image file
export function findMatchingExerciseImage(exerciseName: string): string | null {
  // Normalize the exercise name
  const normalized = exerciseName.trim();
  
  // Check exact match first
  if (exerciseImageMap[normalized]) {
    return exerciseImageMap[normalized];
  }
  
  // Check case-insensitive match
  const lowerExercise = normalized.toLowerCase();
  for (const [key, value] of Object.entries(exerciseImageMap)) {
    if (key.toLowerCase() === lowerExercise) {
      return value;
    }
  }
  
  // Check partial matches (exercise name contains key or key contains exercise name)
  for (const [key, value] of Object.entries(exerciseImageMap)) {
    if (lowerExercise.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(lowerExercise)) {
      return value;
    }
  }
  
  return null;
}

// Get anatomical images for a specific condition
export function getAnatomicalImages(condition: string): string[] {
  return anatomicalImagesByCondition[condition] || [];
}