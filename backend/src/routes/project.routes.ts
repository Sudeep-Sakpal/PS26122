import { Router } from "express";
import {
  createProject,
  getProjectById,
  getProjects,
} from "../controllers/project.controller";
import { getProjectActivities } from "../controllers/activity.controller";
import { importSchedule } from "../controllers/schedule.controller";
import { uploadSchedule } from "../middleware/upload";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.get("/:id/activities", getProjectActivities);
router.post("/:id/schedule", uploadSchedule, importSchedule);

export default router;
