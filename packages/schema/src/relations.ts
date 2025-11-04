import { relations } from "drizzle-orm";
import {
  airflowDagRuns,
  columnMappings,
  connections,
  mappingProjects,
  migrationExecutions,
  pipelineExecutions,
  pipelines,
  projectExecutions,
  schedules,
  tableMappings,
  transformations,
  users,
  validationReports,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  connections: many(connections),
  mappingProjects: many(mappingProjects),
  transformations: many(transformations),
  migrationExecutions: many(migrationExecutions),
}));

export const connectionsRelations = relations(connections, ({ one, many }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  sourceMappingProjects: many(mappingProjects, {
    relationName: "sourceConnection",
  }),
  targetMappingProjects: many(mappingProjects, {
    relationName: "targetConnection",
  }),
}));

export const mappingProjectsRelations = relations(
  mappingProjects,
  ({ one, many }) => ({
    user: one(users, {
      fields: [mappingProjects.userId],
      references: [users.id],
    }),
    sourceConnection: one(connections, {
      fields: [mappingProjects.sourceConnectionId],
      references: [connections.id],
      relationName: "sourceConnection",
    }),
    targetConnection: one(connections, {
      fields: [mappingProjects.targetConnectionId],
      references: [connections.id],
      relationName: "targetConnection",
    }),
    tableMappings: many(tableMappings),
    migrationExecutions: many(migrationExecutions),
    pipelines: many(pipelines),
    projectExecutions: many(projectExecutions),
    schedules: many(schedules),
  })
);

export const tableMappingsRelations = relations(
  tableMappings,
  ({ one, many }) => ({
    project: one(mappingProjects, {
      fields: [tableMappings.projectId],
      references: [mappingProjects.id],
    }),
    pipeline: one(pipelines, {
      fields: [tableMappings.pipelineId],
      references: [pipelines.id],
    }),
    columnMappings: many(columnMappings),
  })
);

export const columnMappingsRelations = relations(columnMappings, ({ one }) => ({
  tableMapping: one(tableMappings, {
    fields: [columnMappings.tableMappingId],
    references: [tableMappings.id],
  }),
  transformation: one(transformations, {
    fields: [columnMappings.transformationId],
    references: [transformations.id],
  }),
}));

export const transformationsRelations = relations(
  transformations,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [transformations.createdBy],
      references: [users.id],
    }),
    columnMappings: many(columnMappings),
  })
);

export const migrationExecutionsRelations = relations(
  migrationExecutions,
  ({ one, many }) => ({
    project: one(mappingProjects, {
      fields: [migrationExecutions.projectId],
      references: [mappingProjects.id],
    }),
    executedBy: one(users, {
      fields: [migrationExecutions.executedBy],
      references: [users.id],
    }),
    validationReports: many(validationReports),
  })
);

export const validationReportsRelations = relations(
  validationReports,
  ({ one }) => ({
    execution: one(migrationExecutions, {
      fields: [validationReports.executionId],
      references: [migrationExecutions.id],
    }),
  })
);

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  project: one(mappingProjects, {
    fields: [pipelines.projectId],
    references: [mappingProjects.id],
  }),
  sourceConnection: one(connections, {
    fields: [pipelines.sourceConnectionId],
    references: [connections.id],
    relationName: "pipelineSourceConnection",
  }),
  targetConnection: one(connections, {
    fields: [pipelines.targetConnectionId],
    references: [connections.id],
    relationName: "pipelineTargetConnection",
  }),
  dependsOnPipeline: one(pipelines, {
    fields: [pipelines.dependsOnPipelineId],
    references: [pipelines.id],
    relationName: "pipelineDependency",
  }),
  dependentPipelines: many(pipelines, {
    relationName: "pipelineDependency",
  }),
  tableMappings: many(tableMappings),
  pipelineExecutions: many(pipelineExecutions),
}));

export const projectExecutionsRelations = relations(
  projectExecutions,
  ({ one, many }) => ({
    project: one(mappingProjects, {
      fields: [projectExecutions.projectId],
      references: [mappingProjects.id],
    }),
    pipelineExecutions: many(pipelineExecutions),
    airflowDagRuns: many(airflowDagRuns),
  })
);

export const pipelineExecutionsRelations = relations(
  pipelineExecutions,
  ({ one }) => ({
    pipeline: one(pipelines, {
      fields: [pipelineExecutions.pipelineId],
      references: [pipelines.id],
    }),
    projectExecution: one(projectExecutions, {
      fields: [pipelineExecutions.projectExecutionId],
      references: [projectExecutions.id],
    }),
  })
);

export const schedulesRelations = relations(schedules, ({ one }) => ({
  project: one(mappingProjects, {
    fields: [schedules.projectId],
    references: [mappingProjects.id],
  }),
}));

export const airflowDagRunsRelations = relations(airflowDagRuns, ({ one }) => ({
  projectExecution: one(projectExecutions, {
    fields: [airflowDagRuns.projectExecutionId],
    references: [projectExecutions.id],
  }),
}));
