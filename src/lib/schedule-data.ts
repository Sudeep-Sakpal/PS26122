import { intakeRecords, intakeSourceLabel } from "@/lib/mock-data";
import type { IntakeSourceType, RiskSeverity, RiskStatus, ScheduleActivity } from "@/types";

// Mock schedule-linked execution chains: one critical-path breakdown per
// project. This is the core PS 26122 concept in data form — planned vs.
// actual progress per stage drives variance, variance drives delay, and
// delay cascades into downstream risk for dependent stages.

export const scheduleActivities: ScheduleActivity[] = [
  // --- prj-001 · NH-44 Bridge Widening — Package B2 ---------------------
  {
    id: "sc-b2-1",
    projectId: "prj-001",
    sequence: 1,
    code: "B2-ST-01",
    name: "Foundation",
    owner: "R. Deshmukh",
    status: "delayed",
    dependsOn: [],
    planned: 100,
    actual: 70,
    plannedStart: "2025-11-01",
    plannedEnd: "2025-12-10",
    actualStart: "2025-11-03",
    delayDays: 18,
    riskReason:
      "Monsoon runoff through late November halted excavation for 9 days; the mandated 72-hour concrete curing cycle pushed pier-cap completion for P5–P7 well past the planned finish.",
    reportReason: "Heavy rainfall",
    matchConfidence: 94,
    updates: [
      {
        id: "u-b2-1-3",
        date: "2025-12-14",
        author: "R. Deshmukh",
        note: "Pier cap P5 concrete pour completed and curing. P6 formwork underway despite continued waterlogging at the batching yard.",
      },
      {
        id: "u-b2-1-2",
        date: "2025-12-08",
        author: "R. Deshmukh",
        note: "Dewatering pumps deployed at P6–P7 excavation. Resuming reinforcement fixing tomorrow.",
      },
      {
        id: "u-b2-1-1",
        date: "2025-11-26",
        author: "R. Deshmukh",
        note: "Excavation at P6 suspended — persistent groundwater ingress after three days of rain.",
      },
    ],
  },
  {
    id: "sc-b2-2",
    projectId: "prj-001",
    sequence: 2,
    code: "B2-ST-02",
    name: "Pillars",
    owner: "A. Kulkarni",
    status: "at-risk",
    dependsOn: ["sc-b2-1"],
    planned: 35,
    actual: 20,
    plannedStart: "2025-12-01",
    plannedEnd: "2026-01-25",
    actualStart: "2025-12-05",
    delayDays: 0,
    riskReason:
      "Pier column reinforcement above Level 2 cannot advance until Foundation reaches full design cure strength (currently 70% complete). A further slip in Foundation will push Pillars directly.",
    updates: [
      {
        id: "u-b2-2-1",
        date: "2025-12-13",
        author: "A. Kulkarni",
        note: "Column cage fabrication for P4–P5 completed off-site; erection queued behind Foundation handover.",
      },
    ],
  },
  {
    id: "sc-b2-3",
    projectId: "prj-001",
    sequence: 3,
    code: "B2-ST-03",
    name: "Beams",
    owner: "A. Kulkarni",
    status: "not-started",
    dependsOn: ["sc-b2-2"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-02-05",
    plannedEnd: "2026-03-20",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-b2-4",
    projectId: "prj-001",
    sequence: 4,
    code: "B2-ST-04",
    name: "Road Surface",
    owner: "S. Nair",
    status: "not-started",
    dependsOn: ["sc-b2-3"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-03-25",
    plannedEnd: "2026-04-30",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-b2-5",
    projectId: "prj-001",
    sequence: 5,
    code: "B2-ST-05",
    name: "Drainage",
    owner: "S. Nair",
    status: "in-progress",
    dependsOn: ["sc-b2-1"],
    planned: 20,
    actual: 20,
    plannedStart: "2025-12-01",
    plannedEnd: "2026-02-15",
    actualStart: "2025-12-02",
    delayDays: 0,
    updates: [
      {
        id: "u-b2-5-1",
        date: "2025-12-11",
        author: "S. Nair",
        note: "Cross-drainage culvert precast units delivered to site; laying on schedule alongside Foundation works.",
      },
    ],
  },

  // --- prj-002 · Metro Corridor 3 — Elevated Section C7 -----------------
  {
    id: "sc-c7-1",
    projectId: "prj-002",
    sequence: 1,
    code: "C7-ST-01",
    name: "Diaphragm Wall",
    owner: "K. Bhatt",
    status: "completed",
    dependsOn: [],
    planned: 100,
    actual: 100,
    plannedStart: "2025-08-01",
    plannedEnd: "2025-09-20",
    actualStart: "2025-08-01",
    actualEnd: "2025-09-18",
    delayDays: 0,
    updates: [
      {
        id: "u-c7-1-1",
        date: "2025-09-18",
        author: "K. Bhatt",
        note: "Final diaphragm wall panel poured and tested; handed over to excavation crew two days ahead of plan.",
      },
    ],
  },
  {
    id: "sc-c7-2",
    projectId: "prj-002",
    sequence: 2,
    code: "C7-ST-02",
    name: "Excavation & Shoring",
    owner: "K. Bhatt",
    status: "delayed",
    dependsOn: ["sc-c7-1"],
    planned: 80,
    actual: 55,
    plannedStart: "2025-09-25",
    plannedEnd: "2025-12-05",
    actualStart: "2025-09-28",
    delayDays: 21,
    riskReason:
      "Groundwater ingress at the station box excavation (see risk R-C7-09) has required continuous dewatering, slowing strut installation below Level 3.",
    reportReason: "Groundwater ingress",
    matchConfidence: 88,
    updates: [
      {
        id: "u-c7-2-2",
        date: "2025-12-10",
        author: "K. Bhatt",
        note: "Second dewatering well commissioned; excavation resumed at Level 3 but productivity remains below plan.",
      },
      {
        id: "u-c7-2-1",
        date: "2025-11-22",
        author: "K. Bhatt",
        note: "Groundwater inflow exceeding design assumption at Level 3 strut line — geotech team investigating.",
      },
    ],
  },
  {
    id: "sc-c7-3",
    projectId: "prj-002",
    sequence: 3,
    code: "C7-ST-03",
    name: "Station Box Structure",
    owner: "V. Rao",
    status: "at-risk",
    dependsOn: ["sc-c7-2"],
    planned: 30,
    actual: 10,
    plannedStart: "2025-11-01",
    plannedEnd: "2026-02-10",
    actualStart: "2025-11-10",
    delayDays: 0,
    riskReason:
      "Base slab casting cannot proceed until excavation reaches founding level across the full station footprint; the Excavation & Shoring slip is expected to defer this stage by 3+ weeks.",
    updates: [
      {
        id: "u-c7-3-1",
        date: "2025-12-05",
        author: "V. Rao",
        note: "Base slab reinforcement drawings issued for construction; mobilising rebar crew ahead of excavation handover.",
      },
    ],
  },
  {
    id: "sc-c7-4",
    projectId: "prj-002",
    sequence: 4,
    code: "C7-ST-04",
    name: "Track Bed & Utilities",
    owner: "M. Iyer",
    status: "not-started",
    dependsOn: ["sc-c7-3"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-03-01",
    plannedEnd: "2026-05-15",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-c7-5",
    projectId: "prj-002",
    sequence: 5,
    code: "C7-ST-05",
    name: "MEP Fit-out",
    owner: "M. Iyer",
    status: "not-started",
    dependsOn: ["sc-c7-4"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-05-20",
    plannedEnd: "2026-07-31",
    delayDays: 0,
    updates: [],
  },

  // --- prj-003 · Krishna River Lift Irrigation Scheme — Phase 9 ---------
  {
    id: "sc-k9-1",
    projectId: "prj-003",
    sequence: 1,
    code: "K9-ST-01",
    name: "Land Clearance & R&R",
    owner: "P. Hegde",
    status: "delayed",
    dependsOn: [],
    planned: 100,
    actual: 60,
    plannedStart: "2025-04-15",
    plannedEnd: "2025-08-31",
    actualStart: "2025-04-20",
    delayDays: 45,
    riskReason:
      "Ongoing land acquisition dispute along canal RD 15.0 (see risk R-K9-01) has blocked handover of a 2.3 km stretch to the civil contractor.",
    reportReason: "Land acquisition dispute",
    matchConfidence: 91,
    updates: [
      {
        id: "u-k9-1-1",
        date: "2025-11-28",
        author: "P. Hegde",
        note: "District administration hearing rescheduled to mid-December; no physical access to RD 14.0–16.3 stretch in the interim.",
      },
    ],
  },
  {
    id: "sc-k9-2",
    projectId: "prj-003",
    sequence: 2,
    code: "K9-ST-02",
    name: "Canal Excavation",
    owner: "P. Hegde",
    status: "in-progress",
    dependsOn: ["sc-k9-1"],
    planned: 70,
    actual: 65,
    plannedStart: "2025-06-01",
    plannedEnd: "2025-11-30",
    actualStart: "2025-06-05",
    delayDays: 4,
    updates: [
      {
        id: "u-k9-2-1",
        date: "2025-12-02",
        author: "P. Hegde",
        note: "Excavation progressing on the cleared stretches; marginally behind plan but within contingency.",
      },
    ],
  },
  {
    id: "sc-k9-3",
    projectId: "prj-003",
    sequence: 3,
    code: "K9-ST-03",
    name: "Canal Lining",
    owner: "P. Hegde",
    status: "delayed",
    dependsOn: ["sc-k9-2"],
    planned: 40,
    actual: 21,
    plannedStart: "2025-07-01",
    plannedEnd: "2025-11-30",
    actualStart: "2025-07-20",
    delayDays: 26,
    riskReason:
      "Lining crews are idle on the disputed stretch; concrete panel output is running at roughly half the planned rate for the quarter.",
    reportReason: "Lining crew idle time",
    matchConfidence: 90,
    updates: [
      {
        id: "u-k9-3-1",
        date: "2025-11-30",
        author: "P. Hegde",
        note: "Lining resumed on RD 12.5–14.0 after excavation handover; RD 14.0 onward remains blocked pending land clearance.",
      },
    ],
  },
  {
    id: "sc-k9-4",
    projectId: "prj-003",
    sequence: 4,
    code: "K9-ST-04",
    name: "Pump House Civil Works",
    owner: "T. Gowda",
    status: "at-risk",
    dependsOn: ["sc-k9-3"],
    planned: 10,
    actual: 0,
    plannedStart: "2025-12-15",
    plannedEnd: "2026-03-10",
    delayDays: 0,
    riskReason:
      "Mobilisation is contingent on canal lining reaching the pump house intake point; the upstream Canal Lining slip puts this start date at risk.",
    updates: [],
  },
  {
    id: "sc-k9-5",
    projectId: "prj-003",
    sequence: 5,
    code: "K9-ST-05",
    name: "Electromechanical Installation",
    owner: "T. Gowda",
    status: "not-started",
    dependsOn: ["sc-k9-4"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-01-10",
    plannedEnd: "2026-03-25",
    delayDays: 0,
    updates: [],
  },

  // --- prj-004 · 765kV Transmission Corridor — Segment 14 ---------------
  {
    id: "sc-s14-1",
    projectId: "prj-004",
    sequence: 1,
    code: "S14-ST-01",
    name: "Tower Foundation Casting",
    owner: "D. Chauhan",
    status: "completed",
    dependsOn: [],
    planned: 100,
    actual: 100,
    plannedStart: "2024-11-01",
    plannedEnd: "2025-06-30",
    actualStart: "2024-11-05",
    actualEnd: "2025-06-28",
    delayDays: 0,
    updates: [
      {
        id: "u-s14-1-1",
        date: "2025-06-28",
        author: "D. Chauhan",
        note: "All 26 tower foundations for Section 19–26 cast and cured; erection crew mobilised.",
      },
    ],
  },
  {
    id: "sc-s14-2",
    projectId: "prj-004",
    sequence: 2,
    code: "S14-ST-02",
    name: "Tower Erection",
    owner: "D. Chauhan",
    status: "in-progress",
    dependsOn: ["sc-s14-1"],
    planned: 75,
    actual: 81,
    plannedStart: "2025-08-01",
    plannedEnd: "2025-12-31",
    actualStart: "2025-08-03",
    delayDays: 0,
    updates: [
      {
        id: "u-s14-2-1",
        date: "2025-12-12",
        author: "D. Chauhan",
        note: "Section 22–26 erection ahead of plan after redeploying a second crane crew from Segment 13.",
      },
    ],
  },
  {
    id: "sc-s14-3",
    projectId: "prj-004",
    sequence: 3,
    code: "S14-ST-03",
    name: "Insulator & Hardware Fixing",
    owner: "N. Verma",
    status: "delayed",
    dependsOn: ["sc-s14-2"],
    planned: 50,
    actual: 38,
    plannedStart: "2025-10-01",
    plannedEnd: "2026-01-15",
    actualStart: "2025-10-05",
    delayDays: 9,
    riskReason:
      "Forest clearance renewal for the Section 22 corridor (see risk R-S14-03) has restricted access for hardware crews on six of the newly erected towers.",
    reportReason: "Forest clearance restrictions",
    matchConfidence: 90,
    updates: [
      {
        id: "u-s14-3-1",
        date: "2025-12-08",
        author: "N. Verma",
        note: "Fixing crews reassigned to Section 19–21 while clearance renewal for Section 22 is pending.",
      },
    ],
  },
  {
    id: "sc-s14-4",
    projectId: "prj-004",
    sequence: 4,
    code: "S14-ST-04",
    name: "Conductor Stringing",
    owner: "N. Verma",
    status: "at-risk",
    dependsOn: ["sc-s14-3"],
    planned: 5,
    actual: 0,
    plannedStart: "2026-01-05",
    plannedEnd: "2026-02-20",
    delayDays: 0,
    riskReason:
      "Stringing cannot start on a span until hardware fixing is complete at both towers; the Insulator & Hardware Fixing slip plus a forecast crew shortage (risk R-S14-06) both threaten the start date.",
    updates: [],
  },
  {
    id: "sc-s14-5",
    projectId: "prj-004",
    sequence: 5,
    code: "S14-ST-05",
    name: "Testing & Commissioning",
    owner: "D. Chauhan",
    status: "not-started",
    dependsOn: ["sc-s14-4"],
    planned: 0,
    actual: 0,
    plannedStart: "2026-02-25",
    plannedEnd: "2026-03-10",
    delayDays: 0,
    updates: [],
  },

  // --- prj-005 · Smart Water Distribution Network — Zone 2 (completed) --
  {
    id: "sc-z2-1",
    projectId: "prj-005",
    sequence: 1,
    code: "Z2-ST-01",
    name: "DMA Civil Works",
    owner: "L. Pillai",
    status: "completed",
    dependsOn: [],
    planned: 100,
    actual: 100,
    plannedStart: "2023-06-01",
    plannedEnd: "2023-09-15",
    actualStart: "2023-06-01",
    actualEnd: "2023-09-10",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-z2-2",
    projectId: "prj-005",
    sequence: 2,
    code: "Z2-ST-02",
    name: "Pipe-laying & Jointing",
    owner: "L. Pillai",
    status: "completed",
    dependsOn: ["sc-z2-1"],
    planned: 100,
    actual: 100,
    plannedStart: "2023-08-01",
    plannedEnd: "2024-04-30",
    actualStart: "2023-08-04",
    actualEnd: "2024-04-25",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-z2-3",
    projectId: "prj-005",
    sequence: 3,
    code: "Z2-ST-03",
    name: "Pumping Station Fit-out",
    owner: "L. Pillai",
    status: "completed",
    dependsOn: ["sc-z2-2"],
    planned: 100,
    actual: 100,
    plannedStart: "2024-02-01",
    plannedEnd: "2024-11-30",
    actualStart: "2024-02-05",
    actualEnd: "2024-11-22",
    delayDays: 0,
    updates: [],
  },
  {
    id: "sc-z2-4",
    projectId: "prj-005",
    sequence: 4,
    code: "Z2-ST-04",
    name: "SCADA Integration",
    owner: "L. Pillai",
    status: "completed",
    dependsOn: ["sc-z2-3"],
    planned: 100,
    actual: 100,
    plannedStart: "2025-04-15",
    plannedEnd: "2025-05-10",
    actualStart: "2025-04-15",
    actualEnd: "2025-05-08",
    delayDays: 0,
    updates: [
      {
        id: "u-z2-4-1",
        date: "2025-05-08",
        author: "L. Pillai",
        note: "SCADA integration signed off; legacy compatibility gap (risk R-Z2-02) resolved with a protocol adapter.",
      },
    ],
  },
  {
    id: "sc-z2-5",
    projectId: "prj-005",
    sequence: 5,
    code: "Z2-ST-05",
    name: "Commissioning & Handover",
    owner: "L. Pillai",
    status: "completed",
    dependsOn: ["sc-z2-4"],
    planned: 100,
    actual: 100,
    plannedStart: "2025-04-30",
    plannedEnd: "2025-05-15",
    actualStart: "2025-04-30",
    actualEnd: "2025-05-15",
    delayDays: 0,
    updates: [
      {
        id: "u-z2-5-1",
        date: "2025-05-15",
        author: "L. Pillai",
        note: "Zone 2 network commissioned and handed over to the municipal water utility.",
      },
    ],
  },
];

export function getScheduleForProject(projectId: string): ScheduleActivity[] {
  return scheduleActivities
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getScheduleActivity(id: string): ScheduleActivity | undefined {
  return scheduleActivities.find((a) => a.id === id);
}

export function variance(activity: ScheduleActivity): number {
  return activity.actual - activity.planned;
}

// Picks the stage a freshly submitted field report would most plausibly
// describe: whichever is furthest off-track, in schedule order.
export function pickReportedActivity(
  chain: ScheduleActivity[]
): ScheduleActivity {
  return (
    chain.find((a) => a.status === "delayed") ??
    chain.find((a) => a.status === "at-risk") ??
    chain.find((a) => a.status === "in-progress") ??
    chain[0]
  );
}

// Walks forward from a stage through its most immediate dependent at each
// step (the successor with the lowest sequence number), tracing the single
// consequence line a delay would travel down rather than every branch.
export function getDownstreamChain(
  chain: ScheduleActivity[],
  start: ScheduleActivity
): ScheduleActivity[] {
  const result: ScheduleActivity[] = [start];
  let current = start;

  while (true) {
    const dependents = chain
      .filter((a) => a.dependsOn.includes(current.id))
      .sort((a, b) => a.sequence - b.sequence);
    if (dependents.length === 0) break;
    current = dependents[0];
    result.push(current);
  }

  return result;
}

// The short cause behind a stage's latest reported progress — the same
// fallback used whether it's shown on the activity page or in a fresh
// intake result.
export function getReportReason(activity: ScheduleActivity): string {
  return (
    activity.reportReason ??
    (activity.status === "delayed" || activity.status === "at-risk"
      ? "Field conditions below plan"
      : "On schedule — no issues reported")
  );
}

// Walks backward through dependsOn (always the first predecessor) to find
// the stage that starts the chain a given activity sits on.
export function getRootActivity(
  chain: ScheduleActivity[],
  activity: ScheduleActivity
): ScheduleActivity {
  let current = activity;
  while (current.dependsOn.length > 0) {
    const parent = chain.find((a) => a.id === current.dependsOn[0]);
    if (!parent) break;
    current = parent;
  }
  return current;
}

export interface ActivitySource {
  type: IntakeSourceType;
  typeLabel: string;
  reference: string;
  confidence: number;
}

// Cross-references an activity's latest field update against the intake
// log to show where its numbers actually came from.
export function getActivitySource(
  activity: ScheduleActivity
): ActivitySource | null {
  const latest = activity.updates[0];
  if (!latest) return null;

  const matchedRecord = intakeRecords.find(
    (r) => r.projectId === activity.projectId && r.submittedOn === latest.date
  );

  const type: IntakeSourceType = matchedRecord?.source ?? "site-report";
  const reference = matchedRecord?.fileName ?? `Field update from ${latest.author}`;
  const confidence =
    activity.matchConfidence ?? matchedRecord?.confidence ?? 90;

  return { type, typeLabel: intakeSourceLabel[type], reference, confidence };
}

export interface IntakeExtraction {
  activity: ScheduleActivity;
  reportDate: string;
  reportReason: string;
  confidence: number;
  downstream: ScheduleActivity[];
}

// Simulates what an intelligent intake pipeline would surface from a freshly
// submitted site report: which stage it's about, why, how confident the
// match is, and which downstream stages inherit the consequence.
export function buildIntakeExtraction(projectId: string): IntakeExtraction {
  const chain = getScheduleForProject(projectId);
  const activity = pickReportedActivity(chain);
  const reportDate =
    activity.updates[0]?.date ?? activity.actualStart ?? activity.plannedStart;
  const reportReason = getReportReason(activity);
  const confidence = activity.matchConfidence ?? 92;
  const downstream = getDownstreamChain(chain, activity);

  return { activity, reportDate, reportReason, confidence, downstream };
}

export interface ScheduleRisk {
  id: string;
  projectId: string;
  trigger: ScheduleActivity;
  severity: RiskSeverity;
  reason: string;
  impacted: ScheduleActivity[];
  confidence: number;
  status: RiskStatus;
}

const severityWeight: Record<RiskSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Stages whose latest update describes an active workaround rather than a
// stage that is simply blocked and waiting on an external decision.
const MITIGATING_TRIGGER_IDS = new Set([
  "sc-b2-1",
  "sc-c7-2",
  "sc-k9-3",
  "sc-s14-3",
]);

// Turns every delayed stage with a known cause into a structured schedule
// risk: what triggered it, why, who it threatens downstream, and how
// confident the system is in that read — the same cascade the dashboard's
// alerts summarize, expanded into the full picture.
export function getScheduleRisks(projectId?: string): ScheduleRisk[] {
  const pool = projectId
    ? scheduleActivities.filter((a) => a.projectId === projectId)
    : scheduleActivities;

  return pool
    .filter((a) => a.status === "delayed" && a.riskReason)
    .map((trigger) => {
      const chain = getScheduleForProject(trigger.projectId);
      const impacted = getDownstreamChain(chain, trigger).slice(1);
      const severity: RiskSeverity =
        trigger.delayDays >= 30
          ? "critical"
          : trigger.delayDays >= 14
            ? "high"
            : "medium";
      const status: RiskStatus = MITIGATING_TRIGGER_IDS.has(trigger.id)
        ? "mitigating"
        : "open";

      return {
        id: `sr-${trigger.id}`,
        projectId: trigger.projectId,
        trigger,
        severity,
        reason: trigger.riskReason!,
        impacted,
        confidence: trigger.matchConfidence ?? 90,
        status,
      };
    })
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
}
