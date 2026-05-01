CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  company_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  company_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'van_sales_user')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer_code TEXT NOT NULL,
  address TEXT,
  contact_number TEXT,
  location_route TEXT,
  company_id TEXT NOT NULL,
  warehouse_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_code TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  company_id TEXT NOT NULL,
  warehouse_id TEXT,
  vehicle_id TEXT,
  role TEXT,
  primary_employee_id TEXT,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (primary_employee_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS route_customers (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  duration INTEGER,
  scheduled_time TEXT,
  priority TEXT DEFAULT 'normal',
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS journey_plans (
  id TEXT PRIMARY KEY,
  plan_name TEXT,
  route_id TEXT,
  assigned_to TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS journey_plan_customers (
  id TEXT PRIMARY KEY,
  journey_plan_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (journey_plan_id) REFERENCES journey_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  journey_plan_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  van_sales_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'complete', 'missed', 'zero_sales')),
  notes TEXT,
  sales_order TEXT,
  visited_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (journey_plan_id) REFERENCES journey_plans(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (van_sales_user_id) REFERENCES users(id)
);
