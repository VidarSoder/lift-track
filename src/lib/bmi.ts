export const ATHLETE_HEIGHT_CM = 190;

const BMI_NORMAL_MIN = 18.5;
const BMI_NORMAL_MAX = 24.9;

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese";

export type BmiMetrics = {
  bmi: number;
  category: BmiCategory;
  categoryLabel: string;
  healthyMinKg: number;
  healthyMaxKg: number;
  kgToNormalMin: number | null;
  kgToNormalMax: number | null;
};

export function bmiForKg(kg: number, heightCm = ATHLETE_HEIGHT_CM) {
  const meters = heightCm / 100;
  return Number((kg / (meters * meters)).toFixed(1));
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

const CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "Underweight",
  normal: "Normal range",
  overweight: "Overweight",
  obese: "Obese",
};

export function healthyWeightRange(heightCm = ATHLETE_HEIGHT_CM) {
  const meters = heightCm / 100;
  const min = BMI_NORMAL_MIN * meters * meters;
  const max = BMI_NORMAL_MAX * meters * meters;
  return {
    minKg: Number(min.toFixed(1)),
    maxKg: Number(max.toFixed(1)),
  };
}

export function bmiMetricsForKg(
  kg: number,
  heightCm = ATHLETE_HEIGHT_CM,
): BmiMetrics {
  const bmi = bmiForKg(kg, heightCm);
  const category = bmiCategory(bmi);
  const { minKg, maxKg } = healthyWeightRange(heightCm);

  return {
    bmi,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    healthyMinKg: minKg,
    healthyMaxKg: maxKg,
    kgToNormalMin: kg < minKg ? Number((minKg - kg).toFixed(1)) : null,
    kgToNormalMax: kg > maxKg ? Number((kg - maxKg).toFixed(1)) : null,
  };
}

export type BmiLogEntry = { date: string; kg: number; bmi: number };

/** BMI points aligned to weigh-in dates — grows with each new weigh-in. */
export function bmiLogFromWeights(
  entries: { date: string; kg: number }[],
  heightCm = ATHLETE_HEIGHT_CM,
): BmiLogEntry[] {
  return entries.map((entry) => ({
    date: entry.date,
    kg: entry.kg,
    bmi: bmiForKg(entry.kg, heightCm),
  }));
}
