export { api, ApiError } from "./client.js";

export {
  contactApi,
  type ContactInput,
  type ContactResult,
} from "./contact.js";

export {
  projectsApi,
  type Project,
  type ProjectDetail,
  type ProjectStatus,
  type Orientation,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CreateFromSourceInput,
  type CreateFromSourceResponse,
} from "./projects.js";

export {
  scenesApi,
  type SceneResponse,
  type SceneStatus,
  type CreateSceneInput,
  type UpdateSceneInput,
} from "./scenes.js";

export {
  executionsApi,
  pollExecution,
  isTerminalExecutionStatus,
  TERMINAL_EXECUTION_STATUSES,
  type Execution,
  type ExecutionStatus,
  type ExecutionTrigger,
  type ExecutionPhase,
  type ExecutionPhaseStatus,
  type WorkflowKind,
  type LogLevel,
} from "./executions.js";

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
  meApi,
  type Me,
  type MeContext,
  type UpdateProfileInput as UpdateMeProfileInput,
  type SwitchContextInput,
  type UserPreferences,
  type UpdatePreferencesInput,
} from "./me.js";

export {
  credentialsApi,
  type Credential,
  type UpsertCredentialInput,
} from "./credentials.js";

export {
  billingApi,
  type BillingInfo,
  type Invoice,
  type Usage,
  type UsageItem,
  type PlanTier,
  type CheckoutInput,
  type PortalInput,
} from "./billing.js";

export {
  workflowsApi,
  type WorkflowRecord,
  type WorkflowStatus,
  type PutWorkflowInput,
} from "./workflows.js";

export {
  sourcesApi,
  type Source,
  type SourceDetail,
  type SourceVideo,
  type SourceVideoKind,
  type CreateSourceInput,
} from "./sources.js";

export {
  targetsApi,
  type Target,
  type TargetPlatform,
  type TargetStatus,
  type CreateTargetInput,
  type UpdateTargetInput,
} from "./targets.js";

export {
  voicesApi,
  type Voice,
} from "./voices.js";

export {
  playgroundApi,
  type PlaygroundPreset,
  type PlaygroundRenderInput,
  type PlaygroundRenderResult,
} from "./playground.js";
