export { api, ApiError } from "./client.js";

export {
  projectsApi,
  type Project,
  type ProjectDetail,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ExportFormat,
  type WorkflowNodeResponse,
  type WorkflowEdgeResponse,
} from "./projects.js";

export {
  scenesApi,
  variationsApi,
  type SceneResponse,
  type VariationResponse,
  type CreateSceneInput,
  type UpdateSceneInput,
  type GenerateVariationsInput,
} from "./scenes.js";

export {
  jobsApi,
  pollJob,
  type Job,
  type JobKind,
  type JobStatus,
  type JobLogEntry,
} from "./jobs.js";

export {
  templatesApi,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type TemplateSummary,
  type TemplateDetail,
  type ParamSpec,
  type StepSpec,
  type StyleModifier,
} from "./templates.js";

export {
  channelsApi,
  type Channel,
  type ChannelDetail,
  type ChannelVideo,
  type ChannelVideoKind,
  type CreateChannelInput,
  type SyncChannelResult,
} from "./channels.js";
