import { Router } from "express";
import {
  createProject,
  getProjectById,
  getProjects,
} from "../controllers/project.controller";
import {
  getActivityByIdHandler,
  getActivityComparisonHandler,
  getProjectActivities,
} from "../controllers/activity.controller";
import { importSchedule } from "../controllers/schedule.controller";
import { getProjectReportsHandler, uploadReportHandler } from "../controllers/report.controller";
import {
  getProjectExecutionUpdatesHandler,
  linkAllUnmatchedHandler,
  linkExecutionUpdateHandler,
} from "../controllers/executionUpdate.controller";
import { uploadSchedule } from "../middleware/upload";
import { uploadReport } from "../middleware/uploadReport";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.get("/:id/activities", getProjectActivities);
router.get("/:id/activities/:activityId", getActivityByIdHandler);
router.get("/:id/activities/:activityId/comparison", getActivityComparisonHandler);
router.post("/:id/schedule", uploadSchedule, importSchedule);
router.post("/:id/reports", uploadReport, uploadReportHandler);
router.get("/:id/reports", getProjectReportsHandler);
router.get("/:id/execution-updates", getProjectExecutionUpdatesHandler);
router.post("/:id/execution-updates/link", linkAllUnmatchedHandler);
router.post("/:id/execution-updates/:updateId/link", linkExecutionUpdateHandler);

export default router;
