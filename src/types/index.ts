export interface Product {
  product_id: string;
  image: string | null;
  product_name: string;
  category: string | null;
  description: string | null;
  price: number;
  barcode: string | null;
  stock: number;
  display_order: number;
}

export interface Order {
  id: number;
  created_at: string;
  total_amount: number;
  tax_amount: number;
  item_count: number;
  pharmacy_id: number | null;
  discount_total: number;
  subtotal_no_tax: number;
  // Joined
  pharmacies?: Pharmacy;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  quantity: number;
  price: number;
  discount: number;
  // Joined
  products?: Product;
}

export interface User {
  id: number;
  username: string;
  password?: string;
  access: number;
  created_at: string;
  auth_id: string | null;
}

export interface Pharmacy {
  id: number;
  Qyteti: string | null;
  Barnatoret: string | null;
  "Licenca e Veprimtarisë": string | null;
  "Data e Përtrirjes": string | null;
  "Farmacisti Përgjegjës": string | null;
}

export interface Session {
  userId: number;
  username: string;
  access: number;
}

export const ROLES: Record<number, string> = {
  1: "Admin",
  2: "Manager",
  3: "Seller",
};

export const PHARMACY_COLUMNS = {
  Qyteti: "City",
  Barnatoret: "Pharmacy Name",
  "Licenca e Veprimtarisë": "Business License",
  "Data e Përtrirjes": "Renewal Date",
  "Farmacisti Përgjegjës": "Responsible Pharmacist",
} as const;
