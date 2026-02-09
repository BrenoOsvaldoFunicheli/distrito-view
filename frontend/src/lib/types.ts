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
}

export interface UtilizationStats {
  total_people: number;
  fully_allocated: number;
  partially_allocated: number;
  on_bench: number;
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
  demand_details: CapacityDemandDetail[];
  supply_allocated: number;
  supply_available: number;
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
