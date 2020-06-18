export interface FreshdeskCustomFields {
  [key: string]: string | number | boolean | Date | string[];
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
  other_companies?: FreshdeskContactOtherCompany[] | null;
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
