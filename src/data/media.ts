export type MediaStep = {
  src: string;
  label: string;
};

export type ExerciseMedia = {
  youtube: string;
  /**
   * free-exercise-db folder name. Used for thumbnails and as the default
   * start/finish pair (0.jpg → start, 1.jpg → finish) when steps/overrides omit.
   */
  slug: string;
  /** Full step sequence (preferred for multi-step stretches). */
  steps?: MediaStep[];
  /** Override start frame (absolute URL or app path like /media/…). */
  start?: string;
  /** Override finish/hold frame (absolute URL or app path like /media/…). */
  finish?: string;
  /** free-exercise-db frame indices when not using start/finish URLs. */
  frames?: { start: 0 | 1; finish: 0 | 1 };
  startSlug?: string;
  finishSlug?: string;
  startFrame?: 0 | 1;
  finishFrame?: 0 | 1;
};

const PHOTO =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

function dbPhoto(slug: string, frame: 0 | 1 = 0) {
  return `${PHOTO}/${slug}/${frame}.jpg`;
}

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  "bench-press": {
    slug: "Barbell_Bench_Press_-_Medium_Grip",
    youtube: "rT7DgCr-3pg",
  },
  "machine-bench": { slug: "Machine_Bench_Press", youtube: "xUm0BiZCWlQ" },
  "incline-db-press": { slug: "Incline_Dumbbell_Press", youtube: "8iPEnn-ltC8" },
  "pec-deck": { slug: "Butterfly", youtube: "Qr7dstCeYtw" },
  "seated-db-press": { slug: "Seated_Dumbbell_Press", youtube: "qEwKCR5JCog" },
  "weighted-dip": { slug: "Dips_-_Triceps_Version", youtube: "2z8JmcrW-As" },
  "skull-crusher": {
    slug: "Decline_EZ_Bar_Triceps_Extension",
    youtube: "d_KZxkY_0cM",
  },
  "rope-pushdown": {
    slug: "Triceps_Pushdown_-_Rope_Attachment",
    youtube: "2-LAMcpzODU",
  },
  "overhead-rope": {
    slug: "Cable_Rope_Overhead_Triceps_Extension",
    youtube: "b_r_LW4HEcM",
  },
  "pull-up": { slug: "Pullups", youtube: "eGo4IYlbE5g" },
  "bodyweight-pull-up": { slug: "Pullups", youtube: "eGo4IYlbE5g" },
  "lat-pulldown": { slug: "Wide-Grip_Lat_Pulldown", youtube: "CAwf7n6Luuc" },
  "cable-row": { slug: "Seated_Cable_Rows", youtube: "GZbfZ033f74" },
  "barbell-curl": { slug: "Barbell_Curl", youtube: "kwG2ipFRgfo" },
  "db-curl": { slug: "Dumbbell_Bicep_Curl", youtube: "ykJmrZ5v0Oo" },
  "incline-curl": { slug: "Incline_Dumbbell_Curl", youtube: "soxrZlIl35U" },
  "hammer-curl": { slug: "Alternate_Hammer_Curl", youtube: "TwD-YGVP4Bk" },
  "goblet-squat": { slug: "Goblet_Squat", youtube: "MeIiIdhvXT4" },
  "bulgarian-split-squat": {
    slug: "Split_Squat_with_Dumbbells",
    youtube: "2C-uNgKwPLE",
  },
  "hip-thrust": { slug: "Barbell_Hip_Thrust", youtube: "SEdqd1n0cvg" },
  "leg-press": { slug: "Leg_Press", youtube: "IZxyjW7MPJQ" },
  "hack-squat": { slug: "Hack_Squat", youtube: "0tn5K9NlCfo" },
  "leg-curl": { slug: "Lying_Leg_Curls", youtube: "1Tq3QdYUuHs" },
  "calf-raise": { slug: "Standing_Calf_Raises", youtube: "YMmgqO8Jo-k" },
  "knee-raise": { slug: "Hanging_Leg_Raise", youtube: "Pr1ieGZ5atk" },
  "cg-bench": {
    slug: "Close-Grip_Barbell_Bench_Press",
    youtube: "nEF0bv2FW94",
  },
  "ez-curl-arms": { slug: "Close-Grip_EZ_Bar_Curl", youtube: "kwG2ipFRgfo" },
  "oh-db-extension": {
    slug: "Standing_Dumbbell_Triceps_Extension",
    youtube: "-Vyt2QdsR7E",
  },
  "incline-curl-arms": { slug: "Incline_Dumbbell_Curl", youtube: "soxrZlIl35U" },
  "pushdown-arms": { slug: "Triceps_Pushdown", youtube: "2-LAMcpzODU" },
  "spider-curl": { slug: "Spider_Curl", youtube: "CITtSuda0Fg" },
  "lateral-raise": { slug: "Side_Lateral_Raise", youtube: "3VcKaXpzqRo" },
  "chest-supported-row": { slug: "Incline_Bench_Pull", youtube: "h2Xafysr43E" },
  "cable-curl-fri": {
    slug: "Standing_Biceps_Cable_Curl",
    youtube: "NFzTWp2qpiE",
  },
  "pushdown-fri": { slug: "Triceps_Pushdown", youtube: "2-LAMcpzODU" },
  "zone2-walk": { slug: "Bodyweight_Walking_Lunge", youtube: "RO1IRfIKlWM" },
  "arm-care": { slug: "External_Rotation", youtube: "FM1B4lIgk8g" },
  "walk-easy-10": { slug: "Bodyweight_Walking_Lunge", youtube: "RO1IRfIKlWM" },
  "walk-easy-30": { slug: "Bodyweight_Walking_Lunge", youtube: "RO1IRfIKlWM" },
  "walk-easy": { slug: "Bodyweight_Walking_Lunge", youtube: "RO1IRfIKlWM" },
  walk: { slug: "Bodyweight_Walking_Lunge", youtube: "RO1IRfIKlWM" },
  run: { slug: "Jogging_Treadmill", youtube: "btKgKarX5CY" },
  "run-7-then-4": { slug: "Jogging_Treadmill", youtube: "btKgKarX5CY" },
  "run-easy-8": { slug: "Jogging_Treadmill", youtube: "btKgKarX5CY" },
  "run-walk-jog": { slug: "Jogging_Treadmill", youtube: "btKgKarX5CY" },
  bike: { slug: "Air_Bike", youtube: "WhoKN__HOlM" },
  "bike-easy-8": { slug: "Air_Bike", youtube: "WhoKN__HOlM" },
  "bike-ramp-10": { slug: "Air_Bike", youtube: "WhoKN__HOlM" },
  "bike-hard-then-easy": { slug: "Air_Bike", youtube: "WhoKN__HOlM" },

  // Stretches — multi-step sequences where the move is easy to misread.
  "cat-cow": {
    slug: "Cat_Stretch",
    youtube: "y39PrKY_4JM",
    steps: [
      {
        src: "/media/stretches/cat-cow-tabletop.jpg",
        label: "1 · Tabletop",
      },
      {
        src: "/media/stretches/cat-cow-cow-pose.jpg",
        label: "2 · Cow",
      },
      {
        src: "/media/stretches/cat-cow-cat-pose.jpg",
        label: "3 · Cat",
      },
    ],
  },
  "neck-side-stretch": {
    slug: "Side_Neck_Stretch",
    youtube: "SedzswEwpPw",
  },
  "cross-body-shoulder-stretch": {
    slug: "Shoulder_Stretch",
    youtube: "6jHsraw2NIk",
  },
  "overhead-tricep-stretch": {
    slug: "Triceps_Stretch",
    youtube: "6jHsraw2NIk",
  },
  "behind-back-biceps-stretch": {
    slug: "Standing_Biceps_Stretch",
    youtube: "w9cj-dovK3o",
    steps: [
      {
        src: dbPhoto("Shoulder_Stretch", 0),
        label: "1 · Stand tall",
      },
      {
        src: dbPhoto("Standing_Biceps_Stretch", 0),
        label: "2 · Clasp behind",
      },
      {
        src: dbPhoto("Standing_Biceps_Stretch", 1),
        label: "3 · Fold & lift",
      },
    ],
  },
  "childs-pose": {
    slug: "Childs_Pose",
    youtube: "RSoK_QxeRlE",
    // Same gym model for steps 1–2 so the fold is readable; side angle clarifies hips-to-heels.
    steps: [
      {
        src: "/media/stretches/childs-pose-1-fold.jpg",
        label: "1 · Sit back & fold",
      },
      {
        src: "/media/stretches/childs-pose-2-reach.jpg",
        label: "2 · Reach arms forward",
      },
      {
        src: "/media/stretches/childs-pose-3-side.jpg",
        label: "3 · Hold (side view)",
      },
    ],
  },
  "knee-to-chest": {
    slug: "One_Knee_To_Chest",
    youtube: "o8gAyDUh2bs",
    steps: [
      {
        src: dbPhoto("One_Knee_To_Chest", 0),
        label: "1 · Lie on back",
      },
      {
        src: dbPhoto("One_Knee_To_Chest", 1),
        label: "2 · One knee",
      },
      {
        src: dbPhoto("Hug_Knees_To_Chest", 1),
        label: "3 · Both knees",
      },
    ],
  },
};

export function photoUrl(slug: string, frame: 0 | 1) {
  return dbPhoto(slug, frame);
}

export function mediaStartSrc(media: ExerciseMedia) {
  const steps = mediaSteps(media);
  return steps[0]?.src ?? photoUrl(media.slug, 0);
}

export function mediaFinishSrc(media: ExerciseMedia) {
  const steps = mediaSteps(media);
  return steps[steps.length - 1]?.src ?? photoUrl(media.slug, 1);
}

export function mediaSteps(media: ExerciseMedia): MediaStep[] {
  if (media.steps && media.steps.length > 0) return media.steps;
  const start =
    media.start ??
    photoUrl(
      media.startSlug ?? media.slug,
      media.startFrame ?? media.frames?.start ?? 0,
    );
  const finish =
    media.finish ??
    photoUrl(
      media.finishSlug ?? media.slug,
      media.finishFrame ?? media.frames?.finish ?? 1,
    );
  return [
    { src: start, label: "Start" },
    { src: finish, label: "Finish" },
  ];
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

export function youtubeWatch(id: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

export function youtubeEmbed(id: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
}

export function mediaFor(exerciseId: string) {
  return EXERCISE_MEDIA[exerciseId];
}
