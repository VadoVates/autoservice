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
  owner?: Customer;
}

export interface Order {
  id: number;
  customer_id: number;
  vehicle_id: number;
  work_station_id?: number;
  description: string;
  priority: "normal" | "high" | "urgent";
  status:
    | "new"
    | "in_progress"
    | "waiting_for_parts"
    | "completed"
    | "invoiced";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_cost: number;
  final_cost?: number;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface QueueData {
  station_1: Order[];
  station_2: Order[];
  waiting: Order[];
  waiting_for_parts: Order[];
  completed?: Order[];
}

export interface Part {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
}

export interface OrderPart {
  id: number;
  part: {
    id: number;
    code: string;
    name: string;
    current_price: number;
    stock_quantity: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}