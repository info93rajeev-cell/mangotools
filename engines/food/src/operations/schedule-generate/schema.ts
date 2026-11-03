import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const version = z.string().regex(/^\d+\.\d+\.\d+$/);

const recipe = z.looseObject({
  id,
  version,
  name: z.string().min(1).max(80),
  servings: z.int().min(1).max(500),
  prepMinutes: z.int().min(0).max(1440),
  cookMinutes: z.int().min(0).max(1440),
  steps: z.array(z.string().min(1).max(400)).min(1).max(30),
});

export const scheduleGenerateInput = z.strictObject({
  recipes: z.array(recipe).min(1).max(200),
  selection: z
    .array(
      z.strictObject({
        recipe: id,
        recipeVersion: version,
      }),
    )
    .min(1)
    .max(50),
  guests: z.int().min(1).max(100000).default(50),
  mealTime: z.string().min(4).max(40).default('13:00'),
  burnersAvailable: z.int().min(1).max(12).default(4),
  prepStations: z.int().min(1).max(8).default(2),
});

export const scheduleGenerateParams = z.strictObject({
  restMinutes: z.int().min(0).max(120).default(10),
  prepScaleFactor: z.enum(['none', 'logarithmic', 'linear-capped']).default('logarithmic'),
});

const taskItem = z.strictObject({
  id: z.string(),
  recipe: id,
  recipeName: z.string(),
  phase: z.enum(['prep', 'active-cooking', 'simmer-rest']),
  description: z.string(),
  durationMinutes: z.int().min(1),
  startOffsetMinutes: z.int(),
  endOffsetMinutes: z.int(),
  startTime: z.string(),
  endTime: z.string(),
  station: z.string(),
  dependsOn: z.array(z.string()),
});

export const scheduleGenerateOutput = z.strictObject({
  timeline: z.array(taskItem),
  totalSpanMinutes: z.int(),
  earliestStartTime: z.string(),
  mealTime: z.string(),
  criticalPath: z.array(z.string()),
  capacityBottlenecks: z.int(),
});

export type ScheduleGenerateInput = z.infer<typeof scheduleGenerateInput>;
export type ScheduleGenerateParams = z.infer<typeof scheduleGenerateParams>;
export type ScheduleGenerateOutput = z.infer<typeof scheduleGenerateOutput>;
export type ScheduleTaskItem = z.infer<typeof taskItem>;
export type ScheduleRecipeInput = ScheduleGenerateInput['recipes'][number];
