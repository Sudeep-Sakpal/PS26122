import type { ProjectStatus } from "../models/Project";
import type { ActivityStatus } from "../models/ScheduleActivity";

// The PS 26122 flagship demo scenario, matching the frontend's mock data
// (src/lib/schedule-data.ts, prj-001 / sc-b2-*): a bridge widening package
// whose Foundation stage is behind schedule, putting Pillars at risk.

export const seedProject = {
  name: "NH-44 Bridge Widening — Package B2",
  code: "NH-44-B2",
  location: "Nagpur, Maharashtra",
  sector: "Highways",
  status: "delayed" as ProjectStatus,
  startDate: new Date("2025-02-10"),
  endDate: new Date("2026-11-30"),
  budgetUtilized: 58,
  contractor: "L&T Infra JV",
  progress: 22,
};

interface SeedActivity {
  sequence: number;
  code: string;
  name: string;
  owner: string;
  status: ActivityStatus;
  planned: number;
  actual: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  delayDays: number;
  dependsOn: string[]; // codes of predecessor activities, resolved at seed time
}

export const seedActivities: SeedActivity[] = [
  {
    sequence: 1,
    code: "B2-ST-01",
    name: "Foundation",
    owner: "R. Deshmukh",
    status: "delayed",
    planned: 100,
    actual: 70,
    plannedStart: new Date("2025-11-01"),
    plannedEnd: new Date("2025-12-10"),
    actualStart: new Date("2025-11-03"),
    delayDays: 18,
    dependsOn: [],
  },
  {
    sequence: 2,
    code: "B2-ST-02",
    name: "Pillars",
    owner: "A. Kulkarni",
    status: "at-risk",
    planned: 35,
    actual: 20,
    plannedStart: new Date("2025-12-01"),
    plannedEnd: new Date("2026-01-25"),
    actualStart: new Date("2025-12-05"),
    delayDays: 0,
    dependsOn: ["B2-ST-01"],
  },
  {
    sequence: 3,
    code: "B2-ST-03",
    name: "Beams",
    owner: "A. Kulkarni",
    status: "not-started",
    planned: 0,
    actual: 0,
    plannedStart: new Date("2026-02-05"),
    plannedEnd: new Date("2026-03-20"),
    delayDays: 0,
    dependsOn: ["B2-ST-02"],
  },
  {
    sequence: 4,
    code: "B2-ST-04",
    name: "Road Surface",
    owner: "S. Nair",
    status: "not-started",
    planned: 0,
    actual: 0,
    plannedStart: new Date("2026-03-25"),
    plannedEnd: new Date("2026-04-30"),
    delayDays: 0,
    dependsOn: ["B2-ST-03"],
  },
  {
    sequence: 5,
    code: "B2-ST-05",
    name: "Drainage",
    owner: "S. Nair",
    status: "in-progress",
    planned: 20,
    actual: 20,
    plannedStart: new Date("2025-12-01"),
    plannedEnd: new Date("2026-02-15"),
    actualStart: new Date("2025-12-02"),
    delayDays: 0,
    dependsOn: ["B2-ST-01"], // runs parallel to Pillars/Beams/Road Surface
  },
];
