export type ExerciseMedia = {
  slug: string;
  youtube: string;
};

const PHOTO =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  "bench-press": { slug: "Barbell_Bench_Press_-_Medium_Grip", youtube: "es2HcgKWMvs" },
  "machine-bench": { slug: "Machine_Bench_Press", youtube: "xumixjXtPFk" },
  "incline-db-press": { slug: "Incline_Dumbbell_Press", youtube: "8iPEnn-ltWE" },
  "seated-db-press": { slug: "Seated_Dumbbell_Press", youtube: "qEwKCR5JCog" },
  "weighted-dip": { slug: "Dips_-_Triceps_Version", youtube: "2z8JmcrW-As" },
  "skull-crusher": { slug: "Decline_EZ_Bar_Triceps_Extension", youtube: "d_KZxkY_0cM" },
  "rope-pushdown": { slug: "Triceps_Pushdown_-_Rope_Attachment", youtube: "nlDC_nk2YI0" },
  "overhead-rope": { slug: "Cable_Rope_Overhead_Triceps_Extension", youtube: "IrVOhK0pNAE" },
  "pull-up": { slug: "Pullups", youtube: "eGo4IYlbE5g" },
  "bodyweight-pull-up": { slug: "Pullups", youtube: "eGo4IYlbE5g" },
  "lat-pulldown": { slug: "Wide-Grip_Lat_Pulldown", youtube: "CAwf7n6Luuc" },
  "cable-row": { slug: "Seated_Cable_Rows", youtube: "G8l_8chR5TU" },
  "barbell-curl": { slug: "Barbell_Curl", youtube: "kwG2ipFRgfo" },
  "incline-curl": { slug: "Incline_Dumbbell_Curl", youtube: "soxrZl3sPVY" },
  "hammer-curl": { slug: "Alternate_Hammer_Curl", youtube: "TwD-YGVP4Bk" },
  "goblet-squat": { slug: "Goblet_Squat", youtube: "MeWKdoCcXg0" },
  "bulgarian-split-squat": { slug: "Split_Squat_with_Dumbbells", youtube: "2C-uNgKwPLE" },
  "hip-thrust": { slug: "Barbell_Hip_Thrust", youtube: "Zp26L8-lyQM" },
  "leg-press": { slug: "Leg_Press", youtube: "IZqNpxJ7L_A" },
  "leg-curl": { slug: "Lying_Leg_Curls", youtube: "1Tq3QdYUuHs" },
  "calf-raise": { slug: "Standing_Calf_Raises", youtube: "gwLzQxJg7lI" },
  "knee-raise": { slug: "Hanging_Leg_Raise", youtube: "Pr1ieGZ5atk" },
  "cg-bench": { slug: "Close-Grip_Barbell_Bench_Press", youtube: "nEF0bv2FW94" },
  "ez-curl-arms": { slug: "Close-Grip_EZ_Bar_Curl", youtube: "kwG2ipFRgfo" },
  "oh-db-extension": { slug: "Standing_Dumbbell_Triceps_Extension", youtube: "-Vyt2QdsR7E" },
  "incline-curl-arms": { slug: "Incline_Dumbbell_Curl", youtube: "soxrZl3sPVY" },
  "pushdown-arms": { slug: "Triceps_Pushdown", youtube: "nlDC_nk2YI0" },
  "spider-curl": { slug: "Spider_Curl", youtube: "keM0QW5x7eE" },
  "lateral-raise": { slug: "Side_Lateral_Raise", youtube: "3VcKaXpzqRo" },
  "chest-supported-row": { slug: "Incline_Bench_Pull", youtube: "0G2_XV7sl0Q" },
  "cable-curl-fri": { slug: "Standing_Biceps_Cable_Curl", youtube: "N6R5tYbYKg8" },
  "pushdown-fri": { slug: "Triceps_Pushdown", youtube: "nlDC_nk2YI0" },
  "zone2-walk": { slug: "Bodyweight_Walking_Lunge", youtube: "a6d8zNwO6n8" },
  "arm-care": { slug: "External_Rotation", youtube: "JyDFNGQQdvw" },
  "walk-easy-10": { slug: "Bodyweight_Walking_Lunge", youtube: "a6d8zNwO6n8" },
  "walk-easy-30": { slug: "Bodyweight_Walking_Lunge", youtube: "a6d8zNwO6n8" },
  "walk-easy": { slug: "Bodyweight_Walking_Lunge", youtube: "a6d8zNwO6n8" },
};

export function photoUrl(slug: string, frame: 0 | 1) {
  return `${PHOTO}/${slug}/${frame}.jpg`;
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatch(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbed(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

export function mediaFor(exerciseId: string) {
  return EXERCISE_MEDIA[exerciseId];
}
