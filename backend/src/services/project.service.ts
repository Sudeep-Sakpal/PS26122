import { Project } from "../models/Project";
import type { CreateProjectInput } from "../validation/project.validation";
import { ApiError } from "../utils/ApiError";

export async function listProjects() {
  return Project.find().sort({ createdAt: -1 });
}

export async function createProject(input: CreateProjectInput) {
  const existing = await Project.findOne({ code: input.code.toUpperCase() });
  if (existing) {
    throw ApiError.conflict(`A project with code "${input.code}" already exists`);
  }
  return Project.create(input);
}

export async function getProjectById(id: string) {
  const project = await Project.findById(id);
  if (!project) {
    throw ApiError.notFound(`Project ${id} not found`);
  }
  return project;
}

export async function requireProjectExists(id: string) {
  const exists = await Project.exists({ _id: id });
  if (!exists) {
    throw ApiError.notFound(`Project ${id} not found`);
  }
}
