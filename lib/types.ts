export type Parsed = { customer_name: string; amount: number; due_date: string; note: string };
export type Sent = { id: string; status: string; pay_link?: string };
export type Row = {
  id: string;
  status: string;
  customer?: string;
  amount?: number;
  due?: string;
  note?: string;
  pay_link?: string;
};