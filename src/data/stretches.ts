import type { Exercise } from "@/lib/types";

/**
 * Stretch library, grouped by the area each move targets.
 * Add new stretches here (aiming for ~20). They show up in Add a lift search
 * and can be pinned into any session — not locked to a training day.
 *
 * Numbering matches the source list (n/20).
 */
export const STRETCH_EXERCISES: Exercise[] = [
  {
    id: "neck-side-stretch",
    name: "Neck side stretch",
    group: "Neck",
    sets: 1,
    reps: "20–30s / side",
    restSec: 0,
    equipment: "None",
    bodyweight: true,
    setup:
      "Sit cross-legged, or stand with feet hip-width. Tall spine, shoulders soft.",
    how: "Place the right hand on top of the head and gently tilt the ear toward the right shoulder. Light pressure with the hand if you want a deeper stretch. Hold 20–30 seconds, then switch sides.",
    mistakes: "Shrugging the shoulder up into the ear, or yanking the head.",
    progress: "Ease into longer holds before adding more pressure.",
  },
  {
    id: "cross-body-shoulder-stretch",
    name: "Cross-body shoulder stretch",
    group: "Shoulders",
    sets: 1,
    reps: "20–30s / side",
    restSec: 0,
    equipment: "None",
    bodyweight: true,
    setup: "Stand with feet hip-width. Soft knees, chest tall.",
    how: "Bring the right arm straight across the upper body. With the left hand, gently pull the right elbow toward the chest. Hold 20–30 seconds, then switch sides.",
    mistakes: "Hiking the stretching shoulder up, or twisting the torso to fake more range.",
    progress: "Keep the shoulder down and breathe into the back of the shoulder.",
  },
  {
    id: "overhead-tricep-stretch",
    name: "Overhead tricep stretch",
    group: "Triceps",
    sets: 1,
    reps: "20–30s / side",
    restSec: 0,
    equipment: "None",
    bodyweight: true,
    setup: "Stand with feet hip-width. Ribs down, neck long.",
    how: "Bend the left arm behind the head so the hand reaches between the shoulder blades. Grasp the left elbow with the right hand and pull gently. Hold 20–30 seconds, then switch sides.",
    mistakes: "Flaring the ribs or cranking the neck forward.",
    progress: "Reach the hand farther down the back before pulling harder on the elbow.",
  },
  {
    id: "behind-back-biceps-stretch",
    name: "Behind-back biceps stretch",
    group: "Biceps",
    sets: 1,
    reps: "20–30s",
    restSec: 0,
    equipment: "None",
    bodyweight: true,
    setup: "Stand with feet hip-width. Soft knees, chest tall.",
    how: "Clasp the hands behind the back and rotate them so the palms face the floor. Slowly fold forward and raise the arms. Hold 20–30 seconds, then stand up gently.",
    mistakes: "Locking the knees hard, or yanking the shoulders into a painful position.",
    progress: "Lift the arms a little higher once the fold feels easy.",
  },
  {
    id: "cat-cow",
    name: "Cat-Cow pose",
    group: "Neck and Back Torso",
    sets: 1,
    reps: "10",
    restSec: 0,
    equipment: "Floor / mat",
    bodyweight: true,
    setup:
      "On all fours — hands and knees on the ground. Hands under the shoulders, knees under the hips. Neutral spine to start.",
    how: "Inhale into cow: drop the belly toward the floor, lift the chest and chin. Exhale into cat: draw the belly to the spine, round the back toward the ceiling, and look down without forcing the chin to the chest. Flow with the breath. Also wakes up the abs. Repeat 10 times.",
    mistakes:
      "Rushing the breath, dumping into the low back on cow, or forcing the chin to the chest on cat.",
    progress: "Slow the tempo or add a second round of 10 before chasing more range.",
  },
  {
    id: "childs-pose",
    name: "Child's pose",
    group: "Lower Back",
    sets: 1,
    reps: "1 min",
    restSec: 0,
    equipment: "Floor / mat",
    bodyweight: true,
    setup:
      "Kneel with the knees wide and the big toes together behind you. Sit the hips back toward the heels.",
    how: "Fold the torso forward and reach the arms long in front. Rest the forehead on the ground (or a fist/block). Soften the shoulders and breathe into the back. Hold about one minute.",
    mistakes: "Forcing the hips to the heels if the knees complain, or holding the breath.",
    progress: "Widen the knees or walk the hands farther to settle deeper.",
  },
  {
    id: "knee-to-chest",
    name: "Knee-to-chest stretch",
    group: "Lower Back and Hips",
    sets: 1,
    reps: "20–30s each",
    restSec: 0,
    equipment: "Floor / mat",
    bodyweight: true,
    setup: "Lie flat on the back. Soft neck, arms relaxed.",
    how: "Bring the right knee to the chest, clasp with both hands, and pull gently. Hold 20–30 seconds, then switch sides. After both sides, hug both knees to the chest and pull gently for another 20–30 seconds, then release.",
    mistakes: "Yanking the knee, or lifting the head and tensing the neck.",
    progress: "Keep the opposite leg long and heavy on the floor during single-leg holds.",
  },
];

export function stretchExercises() {
  return STRETCH_EXERCISES;
}

export function stretchesByRegion() {
  const groups: { group: string; exercises: Exercise[] }[] = [];
  const index = new Map<string, Exercise[]>();
  for (const exercise of STRETCH_EXERCISES) {
    let bucket = index.get(exercise.group);
    if (!bucket) {
      bucket = [];
      index.set(exercise.group, bucket);
      groups.push({ group: exercise.group, exercises: bucket });
    }
    bucket.push(exercise);
  }
  return groups;
}
