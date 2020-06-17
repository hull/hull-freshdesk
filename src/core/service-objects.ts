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
  email?: string;
  phone?: string;
  mobile?: string;
  twitter_id?: string;
  unique_external_id?: string;
  other_emails?: string[];
  company_id?: number;
  view_all_tickets?: boolean;
  other_companies?: FreshdeskContactOtherCompany[];
  address?: string;
  custom_fields?: FreshdeskCustomFields;
  description?: string;
  job_title?: string;
  language?: string;
  tags?: string[];
  time_zone?: string;
}

export interface FreshdeskContact extends FreshdeskContactCreateUpdate {
  active: boolean;
  deleted?: boolean;
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
