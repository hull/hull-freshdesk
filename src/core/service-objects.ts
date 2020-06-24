import {
  IHullUserEventProps,
  IHullUserEventContext,
} from "../types/user-event";

export interface FreshdeskCustomFields {
  [key: string]: string | number | boolean | Date | string[] | undefined | null;
}

export interface FreshdeskChoices {
  [key: string]: string | number | boolean | Date;
}

export interface FreshdeskContactOtherCompany {
  company_id: number;
  view_all_tickets: boolean;
}

export interface FreshdeskContactCreateUpdate {
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  twitter_id?: string | null;
  unique_external_id?: string | null;
  other_emails?: string[] | null;
  company_id?: number | null;
  view_all_tickets?: boolean | null;
  other_companies?: FreshdeskContactOtherCompany[] | number[] | null;
  address?: string | null;
  custom_fields?: FreshdeskCustomFields | null;
  description?: string | null;
  job_title?: string | null;
  language?: string | null;
  tags?: string[] | null;
  time_zone?: string | null;
}

export interface FreshdeskContact extends FreshdeskContactCreateUpdate {
  active: boolean;
  deleted?: boolean | null;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FreshdeskContactField {
  editable_in_signup: boolean;
  id: number;
  label: string;
  name: string;
  position: number;
  type: string;
  customers_can_edit: boolean;
  label_for_customers: string;
  required_for_customers: boolean;
  displayed_for_customers: boolean;
  required_for_agents: boolean;
  choices?: FreshdeskChoices;
  created_at: string;
  updated_at: string;
  default?: boolean;
}

export interface FreshdeskCompanyField {
  id: number;
  name: string;
  label: string;
  field_type?: string;
  required_for_agent: boolean;
  position: number;
  default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreshdeskFilterResult<T> {
  total: number;
  results: T[];
}

export interface FreshdeskCompanyCreateOrUpdate {
  custom_fields?: FreshdeskCustomFields | null;
  description?: string | null;
  domains?: string[] | null;
  name: string;
  note?: string | null;
  health_score?: string | null;
  account_tier?: string | null;
  renewal_date?: string | null;
  industry?: string | null;
}

export interface FreshdeskCompany extends FreshdeskCompanyCreateOrUpdate {
  id: number;
  created_at: string;
  updated_at: string;
}

export type FreshdeskObjectMetaType = "contact" | "company";

export type OutgoingOperationType = "insert" | "update" | "skip";

export interface OutgoingOperationEnvelope<T, U> {
  message: T;
  serviceId?: number;
  serviceObject?: U;
  operation: OutgoingOperationType;
  notes?: string[];
}

export interface IncomingData<T, U> {
  objectType: "user" | "account" | "event";
  ident: T;
  attributes: U;
  properties?: IHullUserEventProps;
  context?: IHullUserEventContext;
  eventName?: string;
}

export interface OutgoingOperationEnvelopesFiltered<T, U> {
  inserts: OutgoingOperationEnvelope<T, U>[];
  updates: OutgoingOperationEnvelope<T, U>[];
  skips: OutgoingOperationEnvelope<T, U>[];
}

export interface FreshdeskAgentContact {
  active: boolean;
  email: string;
  job_title?: string | null;
  language: string;
  last_login_at?: string | null;
  mobile?: string | null;
  name: string;
  phone?: string | number | null;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface FreshdeskAgent {
  available: boolean;
  occasional: boolean;
  signature?: string | null;
  ticket_scope: number;
  skill_ids?: number[] | null;
  group_ids?: number[] | null;
  role_ids?: number[] | null;
  id: number;
  created_at: string;
  updated_at: string;
  available_since?: string | number | null;
  type: string;
  contact: FreshdeskAgentContact;
}

export interface FreshdeskErrorResponseField {
  field?: string | null;
  message?: string | null;
  code?: string | null;
}

export interface FreshdeskErrorDetails {
  description?: string | null;
  errors: FreshdeskErrorResponseField[];
}

export type ApiMethod = "query" | "insert" | "update" | "delete";

export interface ApiResultObject<T, U> {
  endpoint: string;
  method: ApiMethod;
  record: T | undefined;
  data: U;
  success: boolean;
  error?: string | string[];
  errorDetails?: FreshdeskErrorDetails;
}

export type CacheScenarioType = "contactFields" | "companyFields";

export interface FreshdeskPagedResult<T> {
  page: number;
  perPage: number;
  results: T[];
  hasMore: boolean;
}

export enum FreshdeskTicketSource {
  Email = 1,
  Portal = 2,
  Phone = 3,
  Chat = 7,
  Mobihelp = 8,
  FeedbackWidget = 9,
  OutboundEmail = 10,
}

export enum FreshdeskTicketStatus {
  Open = 2,
  Pending = 3,
  Resolved = 4,
  Closed = 5,
}

export enum FreshdeskTicketPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}

export interface FreshdeskTicketIncludeRequester {
  id: number;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
}

export interface FreshdeskTicketIncludeStats {
  agent_responded_at?: string | null;
  requester_responded_at?: string | null;
  first_responded_at?: string | null;
  status_updated_at?: string | null;
  reopened_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  pending_since?: string | null;
}

export interface FreshdeskTicketCreateOrUpdate {
  name?: string | null;
  requester_id?: number | null;
  email?: string | null;
  facebook_id?: string | null;
  phone?: string | null;
  twitter_id?: string | null;
  unique_external_id?: string | null;
  subject?: string | null;
  type?: string | null;
  status: FreshdeskTicketStatus;
  priority: FreshdeskTicketPriority;
  description?: string | null;
  responder_id?: number | null;
  attachments?: object[] | null;
  cc_emails?: string[] | null;
  custom_fields?: FreshdeskCustomFields | null;
  due_by?: string | null;
  email_config_id?: number | null;
  fr_due_by?: string | null;
  group_id?: number | null;
  product_id?: number | null;
  source: FreshdeskTicketSource;
  tags?: string[] | null;
  company_id?: number | null;
}

export interface FreshdeskTicket extends FreshdeskTicketCreateOrUpdate {
  deleted?: boolean | null;
  description_text?: string | null;
  fr_escalated?: boolean | null;
  fwd_emails?: string[] | null;
  id: number;
  is_escalated?: boolean | null;
  reply_cc_emails?: string[] | null;
  spam?: boolean | null;
  to_emails?: string[] | null;
  created_at: string;
  updated_at: string;
  requester?: FreshdeskTicketIncludeRequester | null;
  stats?: FreshdeskTicketIncludeStats | null;
}

export type FreshdeskTicketListOrderBy =
  | "created_at"
  | "due_by"
  | "updated_at"
  | "status";
export type FreshdeskTicketListOrderDir = "asc" | "desc";
export type FreshdeskTicketListIncludes = "requester" | "stats" | "description";
