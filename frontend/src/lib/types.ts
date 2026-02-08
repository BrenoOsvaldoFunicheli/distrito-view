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
