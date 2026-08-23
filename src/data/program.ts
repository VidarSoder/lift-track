import { WARMUP_PRESETS, warmupLabel } from "@/data/warmup";
import type { Exercise, ProgramDay, Weekday } from "@/lib/types";

export const ATHLETE_NAME = "Vidar";
export const PROGRAM_NAME = "Get Huge Arms";
export const TIMEZONE = "Europe/Stockholm";

export const DAYS: ProgramDay[] = [
  {
    id: "push",
    weekday: "monday",
    title: "Push · chest, shoulders, triceps",
    source: "Get Huge Arms + second workout",
    focus: "Press strength first, then overload the long and lateral heads of the triceps.",
    durationMin: "55–70",
    warmup: [
      "3 minutes easy bike or row",
      "Band pull-aparts 2×15",
      "Push-up + downward dog 2×8",
      "Empty-bar bench 2×10",
    ],
    coaching:
      "Treat the first three lifts as the engine. Arms grow from the extra triceps work at the end — do not rush it. Leave 1–2 reps in the tank on compounds, take the last triceps set close to failure.",
    exercises: [
      {
        id: "bench-press",
        name: "Barbell bench press",
        group: "Chest",
        sets: 4,
        reps: "6–8",
        restSec: 150,
        tempo: "3-0-1-0",
        equipment: "Barbell + bench",
        setup:
          "Eyes under the bar, shoulder blades pinched and down, feet planted, slight arch. Unrack by locking out over the chest, not by dragging the bar forward.",
        how: "Lower to the lower chest with elbows about 45°. Press up and slightly back. Drive the floor through your feet. Do not bounce.",
        mistakes: "Flaring elbows to 90°, bouncing off the chest, or losing the packed-shoulder position.",
        progress: "When all 4 sets hit 8 clean reps, add 2.5 kg next Monday.",
      },
      {
        id: "machine-bench",
        name: "Machine chest press",
        group: "Chest",
        sets: 3,
        reps: "8–12",
        restSec: 90,
        tempo: "2-0-1-0",
        equipment: "Chest press machine",
        setup:
          "Seat so the handles sit at mid-chest. Shoulder blades packed against the pad. Feet flat.",
        how: "Press until the elbows are almost straight, squeeze the chest, then let the handles come back to a stretch without the stack slamming.",
        mistakes: "Locking out hard and losing the shoulders, or bouncing the plates at the bottom.",
        progress: "Add a plate after 3×12 with a pause on the chest.",
      },
      {
        id: "incline-db-press",
        name: "Incline dumbbell press",
        group: "Chest",
        sets: 3,
        reps: "8–10",
        restSec: 120,
        tempo: "3-0-1-0",
        equipment: "Dumbbells, bench at 30°",
        setup:
          "30° is enough. Retract the shoulders before the first rep. Start with bells over the chest, not over the face.",
        how: "Lower until the elbows are just below the bench line. Press in a slight arc so the bells meet above the chest.",
        mistakes: "Bench too steep (becomes a shoulder press) or letting the bells crash together at the top.",
        progress: "Add 2 kg per hand after 3×10 with the same load.",
      },
      {
        id: "seated-db-press",
        name: "Seated dumbbell press",
        group: "Shoulders",
        sets: 3,
        reps: "8–10",
        restSec: 120,
        tempo: "2-0-1-0",
        equipment: "Dumbbells + upright bench",
        setup:
          "Back supported, ribs down. Bells at ear height, wrists stacked. Same press you like on Friday — log it here too.",
        how: "Press up, lock out over the ears, lower to 90°. Do not bounce out of the bottom.",
        mistakes: "Flaring into a wide cactus, or leaning the bench into a chest press.",
        progress: "Add 2 kg per hand after 3×10.",
      },
      {
        id: "weighted-dip",
        name: "Weighted dip or close-grip bench",
        group: "Triceps",
        sets: 3,
        reps: "8–10",
        restSec: 120,
        tempo: "3-0-1-0",
        equipment: "Dip station or barbell",
        setup:
          "If shoulders feel dicey, switch to close-grip bench with a shoulder-width grip. Otherwise lean slightly forward on dips and keep the elbows tracking back.",
        how: "Lower until the upper arm is parallel. Drive through the heels of the hands and finish with a hard triceps lockout.",
        mistakes: "Dumping into the bottom stretch with loose shoulders, or cutting the lockout short.",
        progress: "Add the smallest plate once 3×10 is clean.",
      },
      {
        id: "skull-crusher",
        name: "EZ-bar skull crusher",
        group: "Triceps",
        sets: 3,
        reps: "10–12",
        restSec: 90,
        tempo: "3-0-1-0",
        equipment: "EZ-bar + bench",
        setup:
          "Upper arms stay angled slightly back, not vertical. That keeps tension on the long head.",
        how: "Bend only at the elbows, lower toward the hairline or just behind the head, then extend without letting the elbows wander out.",
        mistakes: "Turning it into a pullover, or bouncing out of the bottom.",
        progress: "If 12 is easy on every set, add 2.5 kg.",
      },
      {
        id: "rope-pushdown",
        name: "Rope pushdown",
        group: "Triceps",
        sets: 3,
        reps: "12–15",
        restSec: 75,
        tempo: "2-1-1-1",
        equipment: "Cable + rope",
        setup:
          "Elbows pinned to the ribs. Step a little back so the cable path is in line with the forearms.",
        how: "Push down, split the rope at the bottom, squeeze 1 second, then let the fists come up only to just above 90°.",
        mistakes: "Hinging at the hips and turning it into a crunch, or letting the elbows drift forward.",
        progress: "Stay in the 12–15 range. Add a plate when all sets hit 15 with a full squeeze.",
      },
      {
        id: "overhead-rope",
        name: "Overhead rope extension",
        group: "Triceps",
        sets: 2,
        reps: "12–15",
        restSec: 75,
        tempo: "3-0-1-0",
        equipment: "Cable + rope",
        setup:
          "Face away from the stack, hinge slightly, upper arms by the ears. This is the long-head stretch from the arms plan.",
        how: "Let the rope pull the hands behind the head, then extend until the elbows are straight. Keep the biceps next to the ears.",
        mistakes: "Flaring the elbows wide or cutting the stretch short.",
        progress: "Chase the stretch more than the load.",
      },
    ],
  },
  {
    id: "pull",
    weekday: "tuesday",
    title: "Pull · back, biceps",
    source: "Get Huge Arms + second workout",
    focus: "Build the back with pull-ups, pulldowns, and a row, then bury the biceps.",
    durationMin: "60–75",
    warmup: [
      "Dead hang 2×20 seconds",
      "Band face pulls 2×15",
      "Cat-camel + thoracic opener 1 minute",
      "Light lat pulldown 2×12",
    ],
    coaching:
      "Heavy pull-ups first, then normal bodyweight pull-ups for extra reps. Rows and pulldowns set the posture for the curls. If the biceps are already fried after rows, that is the point — still do the curl work with a full squeeze, even if the load drops.",
    exercises: [
      {
        id: "pull-up",
        name: "Weighted pull-up",
        group: "Back",
        sets: 4,
        reps: "6–8",
        restSec: 150,
        tempo: "3-0-1-0",
        equipment: "Pull-up bar",
        setup:
          "Shoulder-width or just outside. Depress the scapula before you pull. Band if you cannot get 6 clean reps.",
        how: "Pull the elbows to the ribs, chest to the bar. Lower to a dead hang without losing the shoulders.",
        mistakes: "Kipping, half-reps, or shrugging the ears to the bar.",
        progress: "Add 2.5 kg after 4×8.",
      },
      {
        id: "bodyweight-pull-up",
        name: "Pull-up",
        group: "Back",
        sets: 3,
        reps: "6–10",
        restSec: 120,
        tempo: "2-0-1-0",
        equipment: "Pull-up bar · bodyweight",
        defaultLoad: 0,
        setup:
          "Overhand, just outside the shoulders. No belt, no plates. Band only if you cannot get 6 clean reps from a dead hang.",
        how: "Scapula down, pull the chest to the bar, lower to a full hang. Same movement as the weighted ones — just you.",
        mistakes: "Kipping, half-reps, or turning it into a chin-up with a mixed grip.",
        progress: "Add a rep until 3×10. Then add a set, or keep these after the weighted ones.",
      },
      {
        id: "lat-pulldown",
        name: "Lat pulldown",
        group: "Back",
        sets: 4,
        reps: "8–12",
        restSec: 120,
        tempo: "3-0-1-0",
        equipment: "Lat pulldown",
        setup:
          "Wide-ish grip, a little lean back. Sit so the pad locks the thighs. Start from a full stretch at the top.",
        how: "Pull the bar to the upper chest, elbows down the sides, pause, then let the arms lengthen.",
        mistakes: "Behind the neck, bouncing the stack, or shrugging the ears up.",
        progress: "Add a plate after 4×12 with a pause on the chest.",
      },
      {
        id: "cable-row",
        name: "Seated cable row",
        group: "Back",
        sets: 3,
        reps: "10–12",
        restSec: 90,
        tempo: "2-1-1-0",
        equipment: "Cable row",
        setup:
          "Sit tall, slight lean from the hips. Start each rep with a scapular pull, then the arms.",
        how: "Pull to the lower abs, squeeze the mid-back, reach forward for a full stretch without rounding.",
        mistakes: "Rocking the torso like a rower on every rep.",
        progress: "Add a plate when 3×12 is clean.",
      },
      {
        id: "barbell-curl",
        name: "Barbell or EZ-bar curl",
        group: "Biceps",
        sets: 4,
        reps: "8–10",
        restSec: 90,
        tempo: "3-0-1-1",
        equipment: "Barbell or EZ-bar",
        setup:
          "Elbows slightly in front of the torso, ribs down. This is the main biceps builder from the arms plan.",
        how: "Curl until the biceps are fully shortened, squeeze 1 second, lower for 3 seconds. No body swing on the first 3 sets; a tiny cheat is allowed on the last 2 reps of set 4.",
        mistakes: "Dumping the elbows back or bouncing out of the bottom.",
        progress: "Add 2.5 kg after 4×10 with a 3-second lower.",
      },
      {
        id: "incline-curl",
        name: "Incline dumbbell curl",
        group: "Biceps",
        sets: 3,
        reps: "10–12",
        restSec: 75,
        tempo: "3-0-1-0",
        equipment: "Dumbbells, bench at 45–60°",
        setup:
          "Let the arms hang behind the body so the long head is stretched. Sit back — do not perch on the edge.",
        how: "Curl without swinging the upper arm forward. Stop just short of letting the bells rest at the bottom.",
        mistakes: "Turning it into a front raise by lifting the elbows.",
        progress: "This is a stretch movement. Add load only when 3×12 is strict.",
      },
      {
        id: "hammer-curl",
        name: "Hammer curl",
        group: "Brachialis / forearms",
        sets: 3,
        reps: "10–12",
        restSec: 75,
        tempo: "2-0-1-0",
        equipment: "Dumbbells",
        setup:
          "Neutral grip, standing tall. The brachialis sits under the biceps and pushes the peak up — do not skip these.",
        how: "Curl like you are carrying two suitcases. Keep the thumbs up the whole way.",
        mistakes: "Rotating into a regular curl halfway up.",
        progress: "Add 2 kg per hand after 3×12.",
      },
    ],
  },
  {
    id: "legs",
    weekday: "wednesday",
    title: "Legs · second workout",
    source: "Second workout",
    focus: "Goblet squats, split squats, and hip thrusts so the legs still work without a bar on the back.",
    durationMin: "50–65",
    warmup: [
      "2 minutes bike",
      "World’s greatest stretch 2/side",
      "Bodyweight squat 2×10",
      "Light goblet squat 2×8",
    ],
    coaching:
      "Legs are not optional on an arm specialization. Goblet squats and split squats hit the quads, hip thrusts cover the hinge, then machines finish it. Stay 2 reps shy of failure if Tuesday’s back is still tired.",
    exercises: [
      {
        id: "goblet-squat",
        name: "Goblet squat",
        group: "Quads / glutes",
        sets: 4,
        reps: "8–10",
        restSec: 120,
        tempo: "3-0-1-0",
        equipment: "Dumbbell or kettlebell",
        setup:
          "Hold the bell against the chest, elbows in. Feet about shoulder width, toes slightly out.",
        how: "Sit between the heels until the elbows brush the knees. Drive up through the mid-foot without letting the chest collapse.",
        mistakes: "Letting the bell drift forward, or cutting depth so it becomes a quarter squat.",
        progress: "Add 2–4 kg after 4×10 with the same depth.",
      },
      {
        id: "bulgarian-split-squat",
        name: "Bulgarian split squat",
        group: "Quads / glutes",
        sets: 3,
        reps: "8–10 / leg",
        restSec: 90,
        tempo: "3-0-1-0",
        equipment: "Dumbbells + bench",
        setup:
          "Back foot on a bench, front foot far enough that the front knee can track over the mid-foot. Tall torso.",
        how: "Drop the back knee toward the floor, then push through the front heel. Do all reps on one leg, then switch.",
        mistakes: "Slamming the back knee, or standing so upright that the front hip never sits.",
        progress: "Add 2 kg per hand after 3×10/leg.",
      },
      {
        id: "hip-thrust",
        name: "Hip thrust",
        group: "Glutes / hamstrings",
        sets: 3,
        reps: "8–12",
        restSec: 120,
        tempo: "2-1-1-0",
        equipment: "Barbell or machine, bench",
        setup:
          "Upper back on a bench, bar over the hips with a pad. Chin tucked, ribs down.",
        how: "Drive the hips up until the torso is a straight line, squeeze, then lower without crashing.",
        mistakes: "Overextending the lower back at the top, or pushing with the toes.",
        progress: "Add 5 kg after 3×12 with a hard squeeze.",
      },
      {
        id: "leg-press",
        name: "Leg press",
        group: "Quads",
        sets: 3,
        reps: "10–12",
        restSec: 90,
        equipment: "Leg press",
        setup:
          "Feet mid-platform, shoulder width. Do not lock the low back off the pad.",
        how: "Lower until the knees are near 90° without the hips tucking. Press through the whole foot.",
        mistakes: "Tiny pulses at the top with a mountain of plates.",
        progress: "Add a plate per side after 3×12.",
      },
      {
        id: "leg-curl",
        name: "Lying or seated leg curl",
        group: "Hamstrings",
        sets: 3,
        reps: "12–15",
        restSec: 75,
        tempo: "2-1-1-0",
        equipment: "Leg curl machine",
        setup:
          "Pad just above the heels. Hips stay glued down.",
        how: "Curl fully, squeeze, lower for 2–3 seconds. This protects the knees for Friday’s pressing.",
        mistakes: "Using the hip flexors to yank the weight.",
        progress: "Add a notch when 3×15 is easy.",
      },
      {
        id: "calf-raise",
        name: "Standing calf raise",
        group: "Calves",
        sets: 4,
        reps: "12–15",
        restSec: 60,
        tempo: "2-1-1-1",
        equipment: "Calf machine or step + DBs",
        setup:
          "Full stretch at the bottom with a straight knee. Pause so the Achilles is loaded, not bounced.",
        how: "Rise onto the big toe, pause, lower to a full stretch.",
        mistakes: "Bouncing in the mid-range.",
        progress: "Add load after 4×15 with pauses.",
      },
      {
        id: "knee-raise",
        name: "Hanging knee or leg raise",
        group: "Core",
        sets: 3,
        reps: "10–15",
        restSec: 60,
        equipment: "Bar or captain’s chair",
        setup:
          "Depress the shoulders. Posteriorly tilt the pelvis so the abs, not the hip flexors, start the rep.",
        how: "Raise, squeeze the lower abs, lower without swinging.",
        mistakes: "Kipping the legs up.",
        progress: "Move from knees to straight legs before adding load.",
      },
    ],
  },
  {
    id: "arms",
    weekday: "thursday",
    title: "Arms · Get Huge Arms day",
    source: "Get Huge Arms by Ryan Spiteri",
    focus: "The specialization day. Alternate triceps and biceps so each muscle recovers while the other works.",
    durationMin: "50–65",
    warmup: [
      "Arm circles and band dislocates 1 minute",
      "Light pushdown 2×15",
      "Light EZ curl 2×15",
      "Elbow openers: 10 slow extensions per arm",
    ],
    finishers: [
      "If elbows feel angry, stop isolation work and ice + extend gently tonight.",
      "Get 40+ g protein in the meal after this session.",
    ],
    coaching:
      "This is the day the PDF is built around. Pair a triceps move with a biceps move, rest 75–90 seconds, then go again. Full range, hard squeeze, no ego on the EZ-bar. If a joint niggles, drop 20% and keep the pump.",
    exercises: [
      {
        id: "cg-bench",
        name: "Close-grip bench press",
        group: "Triceps",
        sets: 4,
        reps: "8–10",
        restSec: 120,
        tempo: "3-0-1-0",
        equipment: "Barbell + bench",
        setup:
          "Hands just inside shoulder width. Same packed-shoulder setup as Monday. This is the heavy triceps compound.",
        how: "Lower to the lower chest, elbows tracking along the ribs, press to a hard lockout.",
        mistakes: "Ultra-narrow grip that fries the wrists.",
        progress: "Add 2.5 kg after 4×10.",
        supersetWith: "ez-curl-arms",
      },
      {
        id: "ez-curl-arms",
        name: "EZ-bar curl",
        group: "Biceps",
        sets: 4,
        reps: "8–10",
        restSec: 90,
        tempo: "3-0-1-1",
        equipment: "EZ-bar",
        setup:
          "Superset with close-grip bench. Rest only after the pair if you need it.",
        how: "Strict first 3 sets. Last set can use a 2-second squeeze at the top on every rep.",
        mistakes: "Swinging so the front delts take over.",
        progress: "Add 2.5 kg after 4×10 strict.",
        supersetWith: "cg-bench",
      },
      {
        id: "oh-db-extension",
        name: "Overhead dumbbell extension",
        group: "Triceps",
        sets: 3,
        reps: "10–12",
        restSec: 75,
        tempo: "3-0-1-0",
        equipment: "One dumbbell, seated",
        setup:
          "Two hands on one bell. Elbows stay high. This loads the long head in a stretch — the key Get Huge Arms pattern.",
        how: "Lower behind the head until you feel the triceps stretch, then extend without slapping the elbows forward.",
        mistakes: "Flaring the elbows out to the sides.",
        progress: "Add 2 kg after 3×12.",
        supersetWith: "incline-curl-arms",
      },
      {
        id: "incline-curl-arms",
        name: "Incline dumbbell curl",
        group: "Biceps",
        sets: 3,
        reps: "10–12",
        restSec: 75,
        tempo: "3-0-1-0",
        equipment: "Dumbbells, 45–60° bench",
        setup:
          "Same stretch-focused curl as Tuesday, slightly lighter if the elbows are tired.",
        how: "Full hang, curl, do not let the elbows travel forward.",
        mistakes: "Rushing the stretch at the bottom.",
        progress: "Hold the same load as Tuesday if you can match the reps.",
        supersetWith: "oh-db-extension",
      },
      {
        id: "pushdown-arms",
        name: "Cable pushdown",
        group: "Triceps",
        sets: 3,
        reps: "12–15",
        restSec: 60,
        tempo: "2-1-1-1",
        equipment: "Cable + bar or rope",
        setup:
          "Straight bar for load, rope for the last set if you want a harder squeeze.",
        how: "Lock out and spread or press down until the triceps cramp. Shorten the range if the elbows complain.",
        mistakes: "Leaning the whole torso into the stack.",
        progress: "Stay in the pump zone. Add a plate only after 3×15.",
        supersetWith: "spider-curl",
      },
      {
        id: "spider-curl",
        name: "Spider curl",
        group: "Biceps",
        sets: 3,
        reps: "12",
        restSec: 60,
        tempo: "2-1-1-0",
        equipment: "EZ-bar or DBs on an incline bench, chest supported",
        setup:
          "Chest on the bench, arms hanging in front. No body English possible — that is the point.",
        how: "Curl to a full squeeze, lower until the arms are straight.",
        mistakes: "Cutting the bottom so the biceps never lengthen.",
        progress: "This is a feel movement. Log the load, but chase the squeeze.",
        supersetWith: "pushdown-arms",
      },
    ],
  },
  {
    id: "shoulders",
    weekday: "friday",
    title: "Shoulders + arm pump",
    source: "Get Huge Arms",
    focus: "Cap the delts, then a shorter pump so Saturday is actually a rest day.",
    durationMin: "45–60",
    warmup: [
      "Band external rotations 2×15",
      "Light lateral raise 2×15",
      "Arm circles 20 each way",
    ],
    coaching:
      "Seated dumbbell press again, a bit easier than Monday. Then laterals and a short arm pump. Do not chase a press PR today.",
    exercises: [
      {
        id: "seated-db-press",
        name: "Seated dumbbell press",
        group: "Shoulders",
        sets: 4,
        reps: "8–10",
        restSec: 120,
        tempo: "2-0-1-0",
        equipment: "Dumbbells + upright bench",
        setup:
          "Same seated press as Monday. Back supported, ribs down. Bells at ear height, wrists stacked.",
        how: "Press to just short of lockout if Monday is still in the shoulders, full lockout if they feel good. Lower to 90°.",
        mistakes: "Bouncing out of the bottom or flaring into a wide “cactus” position.",
        progress: "Add 2 kg per hand after 4×10.",
      },
      {
        id: "lateral-raise",
        name: "Lateral raise",
        group: "Side delts",
        sets: 4,
        reps: "12–15",
        restSec: 60,
        tempo: "2-0-1-0",
        equipment: "Dumbbells",
        setup:
          "Soft elbows, lead with the elbows not the pinkies-up trapezius shrug.",
        how: "Raise to just below shoulder height, lower for 2 seconds. Last set can be a drop set: do 12, drop 4 kg, do 8 more.",
        mistakes: "Swinging from the hips or raising above the ears.",
        progress: "Tiny jumps. Side delts grow from clean volume.",
      },
      {
        id: "chest-supported-row",
        name: "Chest-supported row",
        group: "Rear delts / back",
        sets: 3,
        reps: "10–12",
        restSec: 75,
        tempo: "2-1-1-0",
        equipment: "Dumbbells or bar, chest on an incline bench",
        setup:
          "Chest on the pad, feet planted. Let the bells hang. The bench does the bracing so you can just row.",
        how: "Row to the ribs, squeeze the rear delts and mid-back, lower without bouncing the bells off the floor.",
        mistakes: "Yanking the torso off the pad, or turning it into a shrug.",
        progress: "Add 2 kg per hand after 3×12.",
      },
      {
        id: "cable-curl-fri",
        name: "Cable curl",
        group: "Biceps",
        sets: 3,
        reps: "12–15",
        restSec: 60,
        tempo: "2-1-1-0",
        equipment: "Cable + bar or EZ",
        setup:
          "Stand close enough that the biceps stay loaded at the bottom.",
        how: "Curl, squeeze, lower to a straight arm. Constant tension is the Friday point.",
        mistakes: "Stepping back and turning it into a hip hinge.",
        progress: "Match Thursday’s pump with less load if needed.",
      },
      {
        id: "pushdown-fri",
        name: "Triceps pushdown",
        group: "Triceps",
        sets: 3,
        reps: "12–15",
        restSec: 60,
        equipment: "Cable",
        setup:
          "Same setup as Monday. This is a pump, not a PR hunt.",
        how: "Full lockout, controlled return. If you want, rest-pause the last set: 10, 10 seconds, 5, 10 seconds, 5.",
        mistakes: "Grinding a weight that moves the elbows all over.",
        progress: "Log the load. Add only when 3×15 is easy.",
      },
    ],
  },
  {
    id: "warmup",
    weekday: "saturday",
    title: "Warm-up · walk, run, bike",
    source: "Easy start, any day",
    focus: "Walk, treadmill, or bike. Do one, or a few, then lift later if you want.",
    durationMin: "8–40",
    warmup: [],
    coaching:
      "This is its own session. Pick a walk, a run, or a bike. Finish it and you can still start Push, Arms, or whatever else the same day.",
    exercises: WARMUP_PRESETS.map((preset) => ({
      id: preset.id,
      name:
        preset.kind === "walk"
          ? "Walk"
          : `${warmupLabel(preset.kind)} · ${preset.title}`,
      group: warmupLabel(preset.kind),
      sets: preset.steps.length,
      reps: preset.steps.map((step) => `${step.minutes} min`).join(" + "),
      restSec: 0,
      equipment:
        preset.kind === "run"
          ? "Treadmill"
          : preset.kind === "bike"
            ? "Exercise bike"
            : "Outdoors or treadmill",
      setup: preset.detail,
      how: preset.steps.map((step) => `${step.minutes} min at ${step.pace}`).join(". Then "),
      mistakes: "Turning the warm-up into the workout.",
      progress:
        preset.kind === "walk"
          ? "Set the minutes you actually walked, then save."
          : "Same pace is fine. Add a minute before you add speed.",
    })),
  },
  {
    id: "rest",
    weekday: "sunday",
    title: "Rest · eat and sleep",
    source: "Recovery",
    focus: "Systemic recovery. Arms need 36–48 hours after Friday’s pump.",
    durationMin: "0",
    warmup: [],
    coaching:
      "Walk if you want. Cook something with 40+ g protein. Get to bed on time — Sunday sleep is Monday bench. If anything is swollen or sharp, skip isolation on Monday and keep the compounds.",
    exercises: [],
  },
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function dayByWeekday(weekday: Weekday) {
  return DAYS.find((day) => day.weekday === weekday) ?? DAYS[6];
}

export function dayById(id: string) {
  return DAYS.find((day) => day.id === id);
}

export function uniqueExercises() {
  const seen = new Set<string>();
  const list: Exercise[] = [];
  for (const day of DAYS) {
    if (day.id === "warmup" || day.id === "rest") continue;
    for (const exercise of day.exercises) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      list.push(exercise);
    }
  }
  return list;
}

export function exercisesByMuscle() {
  const groups: { group: string; exercises: Exercise[] }[] = [];
  const index = new Map<string, Exercise[]>();
  for (const exercise of uniqueExercises()) {
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

export const TIME_TIPS = [
  {
    id: "afternoon",
    title: "Best window: 16:00–19:00",
    body: "Strength and body temperature usually peak here. Use this for Monday, Tuesday, and Thursday if your schedule allows.",
  },
  {
    id: "morning",
    title: "If you train before 10:00",
    body: "Add 8–10 extra warm-up reps on the first lift and start one increment lighter. Eat something with carbs and salt first.",
  },
  {
    id: "evening",
    title: "After 20:00",
    body: "Keep rest periods honest so you are not still wired at midnight. Skip pre-workout stimulants.",
  },
];

export const FEEL_GUIDE = {
  afterGood:
    "A dull pump and tired arms is the goal. You should still be able to straighten the elbows tonight.",
  afterBad:
    "Sharp joint pain, pins-and-needles, or a sudden strength drop means you stop isolation work and keep only easy compounds next session.",
  food: "Within 2 hours: protein (40 g+) and carbs. Arms do not grow from the workout alone.",
  deload:
    "If two weeks in a row the same lift drops and sleep is trash, cut sets in half for 5 days, then resume.",
};

export const BOOKMARK_HINT =
  "Open the unlock link once, then add this site to your iPhone Home Screen (Share → Add to Home Screen). You will not need to type the passphrase again.";
