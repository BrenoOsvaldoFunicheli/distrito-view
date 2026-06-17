export interface Client {
  id: number;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  sector: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface PersonRoleInfo {
  role: Role;
  is_primary: boolean;
}

export interface Person {
  id: number;
  name: string;
  email: string;
  company: string;
  is_active: boolean;
  terminated_at: string | null;
  notes: string | null;
  roles: PersonRoleInfo[];
  created_at: string;
  updated_at: string;
}

export interface ContractRole {
  id: number;
  role: Role;
  allocation_percentage: number;
  quantity: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

export interface Contract {
  id: number;
  client: Client;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  plan_type: string | null;
  mrr: number | null;
  total_value: number | null;
  duration_months: number | null;
  payment_method: string | null;
  notes: string | null;
  contract_roles: ContractRole[];
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "active" | "paused" | "completed";

export interface Project {
  id: number;
  contract_id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithContext extends Project {
  contract_name: string;
  client_id: number;
  client_name: string;
}

export interface Allocation {
  id: number;
  person_id: number;
  person_name: string;
  contract_role_id: number;
  contract_name: string;
  client_name: string;
  role_name: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnallocatedPerson {
  person_id: number;
  person_name: string;
  person_email: string;
  roles: string[];
  current_allocation_ends: string | null;
  current_percentage: number;
  days_until_unallocated: number | null;
  next_allocation_start: string | null;
  next_allocation_contract_name: string | null;
  next_allocation_client_name: string | null;
  next_allocation_role_name: string | null;
}

export interface UpcomingNeed {
  contract_id: number;
  contract_name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  role_name: string;
  contract_role_id: number;
  needed_quantity: number;
  filled_quantity: number;
  allocation_percentage: number;
  days_until_start: number;
  is_future_contract: boolean;
}

export interface UtilizationStats {
  total_people: number;
  fully_allocated: number;
  partially_allocated: number;
  on_bench: number;
  provisioned: number;
  average_utilization: number;
}

export interface AllocationSummaryEntry {
  person_id: number;
  person_name: string;
  person_email: string;
  person_company: string;
  roles: string[];
  current_allocation_percentage: number;
  allocations: {
    allocation_id: number;
    contract_name: string;
    client_name: string;
    role_name: string;
    percentage: number;
    start_date: string;
    end_date: string;
  }[];
}

export interface TimelineEntry {
  person_id: number;
  person_name: string;
  person_company: string;
  allocations: {
    allocation_id: number;
    contract_name: string;
    client_name: string;
    role_name: string;
    percentage: number;
    start_date: string;
    end_date: string;
  }[];
}

export interface CapacityDemandDetail {
  contract_id: number;
  contract_name: string;
  client_name: string;
  quantity: number;
  fte: number;
  allocation_percentage: number;
  filled: number;
  unfilled: number;
  contract_start: string;
  contract_end: string;
  contract_status: string;
}

export interface CapacityPersonContract {
  contract_name: string;
  client_name: string;
  percentage: number;
  end_date: string;
}

export interface CapacitySupplyDetail {
  person_id: number;
  person_name: string;
  person_company: string;
  allocation_in_month: number;
  current_contracts: CapacityPersonContract[];
  status: "allocated" | "partial" | "bench";
  becoming_free: boolean;
  allocation_ends: string | null;
}

export interface CapacityRoleSummary {
  role_id: number;
  role_name: string;
  demand_slots: number;
  unfilled_slots: number;
  demand_details: CapacityDemandDetail[];
  supply_allocated: number;
  supply_available: number;
  supply_bench: number;
  supply_details: CapacitySupplyDetail[];
  gap: number;
}

export interface CapacityTotals {
  total_demand: number;
  total_allocated: number;
  total_available: number;
  total_gap: number;
  total_people: number;
  total_bench: number;
}

export interface CapacityPlanningData {
  month: string;
  roles: CapacityRoleSummary[];
  totals: CapacityTotals;
}

export interface OpenSlotRole {
  role_id: number;
  role_name: string;
  unfilled_slots: number;
}

export interface OpenSlotsData {
  total: number;
  roles: OpenSlotRole[];
}

export type ProposalStage = string;

export interface ProposalStageDef {
  id: number;
  key: string;
  label: string;
  position: number;
  is_terminal: boolean;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  is_admin: boolean;
  groups: string[];
  areas: string[];
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  areas: string[];
  member_ids: number[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface AreaInfo {
  key: string;
  label: string;
}

export type FarolColor = "none" | "green" | "yellow" | "red";
export type FarolKind = "manual" | "calculated_allocation" | "macro";

export interface FarolCriterion {
  id: number;
  label: string;
  kind: FarolKind;
  show_color: boolean;
  show_text: boolean;
  position: number;
  group_id: number | null;
  weights: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface FarolGroup {
  id: number;
  label: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type FarolScope = "client" | "project" | "hierarchical";

export interface FarolBoardColumn {
  id: number;
  name: string;
  subtitle: string | null;
  client_id?: number | null;
  client_name?: string | null;
  is_client_summary?: boolean;
}

export interface FarolBoardCell {
  criterion_id: number;
  column_id: number;
  color: FarolColor;
  text_value: string | null;
  notes: string | null;
  computed: boolean;
}

export interface FarolBoard {
  week_start: string;
  scope: FarolScope;
  groups: FarolGroup[];
  criteria: FarolCriterion[];
  columns: FarolBoardColumn[];
  cells: FarolBoardCell[];
}

export interface FarolClientSummaryProject {
  id: number;
  name: string;
  color: FarolColor;
}

export interface FarolClientSummary {
  client_id: number;
  week_start: string;
  color: FarolColor;
  projects: FarolClientSummaryProject[];
}

export interface FarolHistoryEntry {
  week_start: string;
  target_kind: "client" | "project";
  target_id: number;
  target_name: string;
  color: FarolColor;
  text_value: string | null;
  notes: string | null;
  computed: boolean;
}

export interface FarolTrendWeek {
  week_start: string;
  green: number;
  yellow: number;
  red: number;
  none: number;
}

export interface FarolTrend {
  weeks: FarolTrendWeek[];
}

export interface Proposal {
  id: number;
  title: string;
  contact_name: string | null;
  contact_email: string | null;
  estimated_value: number | null;
  expected_close_date: string | null;
  expected_start_date: string | null;
  source: string | null;
  notes: string | null;
  stage: ProposalStage;
  lost_reason: string | null;
  position: number;
  client: Client | null;
  client_id: number | null;
  contract_id: number | null;
  created_at: string;
  updated_at: string;
}
