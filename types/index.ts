export interface LineItem {
  id: string;
  product: string;
  qty: number;
  price: number;
}

export interface Quote {
  id: string;
  title: string;
  client: string;
  items: LineItem[];
  total: number;
  status: "draft" | "pending" | "approved";
  createdAt: string;
}

export interface Order {
  id: string;
  quoteId: string;
  title: string;
  client: string;
  items: LineItem[];
  total: number;
  status: "processing" | "shipped" | "delivered";
  createdAt: string;
}

export interface Point {
  x: number;
  y: number;
}
