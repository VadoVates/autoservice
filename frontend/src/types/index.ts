export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  customer_id: number;
  brand: string;
  model: string;
  year?: number;
  registration_number: string;
  vin?: string;
}

export interface Order {
  id: number;
  customer_id: number;
  vehicle_id: number;
  work_station_id?: number;
  description: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting_for_parts' | 'completed' | 'invoiced';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_cost: number;
  final_cost?: number;
}