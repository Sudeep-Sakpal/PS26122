import { Types } from "mongoose";
import { Dependency } from "../models/Dependency";

// Pure graph traversal over the Dependency collection. Knows nothing
// about risk, severity, or delay — that's riskEngine.service.ts. A
// Dependency doc means `activity` depends on `dependsOn`, i.e. the edge
// runs dependsOn -> activity (Foundation -> Pillars when Pillars depends
// on Foundation).

export interface DownstreamNode {
  activityId: string;
  distance: number; // 1 = direct successor, 2 = successor-of-successor, ...
}

/** Builds a project's full dependsOn -> [successor activity ids] map in
 * one query, so multi-activity traversals (the risk engine calls this
 * once per delayed trigger) don't each re-fetch the same edges. */
async function buildSuccessorMap(projectId: string): Promise<Map<string, string[]>> {
  const edges = await Dependency.find({ project: new Types.ObjectId(projectId) })
    .select("activity dependsOn")
    .lean();

  const successorsOf = new Map<string, string[]>();
  for (const edge of edges) {
    const key = edge.dependsOn.toString();
    const successor = edge.activity.toString();
    const list = successorsOf.get(key) ?? [];
    // Guards against a duplicate/repeated edge fanning the same
    // successor in twice within one node's adjacency list.
    if (!list.includes(successor)) list.push(successor);
    successorsOf.set(key, list);
  }
  return successorsOf;
}

/**
 * Breadth-first traversal of every downstream (successor) activity
 * reachable from `startActivityId`, each annotated with its shortest
 * dependency distance. A `visited` set both prevents an activity from
 * appearing twice (e.g. a diamond-shaped graph) and protects against
 * infinite loops if the stored data ever contains a cycle.
 */
export async function getDownstreamActivities(
  projectId: string,
  startActivityId: string
): Promise<DownstreamNode[]> {
  const successorsOf = await buildSuccessorMap(projectId);

  const startId = startActivityId.toString();
  const visited = new Set<string>([startId]);
  const result: DownstreamNode[] = [];

  let frontier = [startId];
  let distance = 0;

  while (frontier.length > 0) {
    distance += 1;
    const nextFrontier: string[] = [];

    for (const current of frontier) {
      for (const successor of successorsOf.get(current) ?? []) {
        if (visited.has(successor)) continue;
        visited.add(successor);
        result.push({ activityId: successor, distance });
        nextFrontier.push(successor);
      }
    }

    frontier = nextFrontier;
  }

  return result;
}

/** Just the direct (distance-1) successors — a thin convenience over the
 * same map, used where callers only care about immediate impact. */
export async function getDirectSuccessors(
  projectId: string,
  activityId: string
): Promise<string[]> {
  const successorsOf = await buildSuccessorMap(projectId);
  return successorsOf.get(activityId.toString()) ?? [];
}

/** Raw edge list for a project, for the optional debug/demo endpoint. */
export async function listDependencyEdges(projectId: string) {
  return Dependency.find({ project: new Types.ObjectId(projectId) })
    .populate("activity", "code name sequence")
    .populate("dependsOn", "code name sequence")
    .lean();
}
