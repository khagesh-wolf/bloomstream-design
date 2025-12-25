# Database Optimization Guide

This guide provides SQL migrations to optimize your Supabase database for high-traffic scenarios.

## Recommended Indexes

Run these SQL commands in your Supabase SQL Editor to add performance-boosting indexes:

```sql
-- ===========================================
-- ORDERS TABLE INDEXES
-- ===========================================

-- Index for fetching orders by status (pending, preparing, ready, etc.)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Index for fetching orders by table number
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);

-- Index for fetching today's orders (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index for status + date queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ===========================================
-- MENU ITEMS TABLE INDEXES
-- ===========================================

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- Index for filtering available items
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- Composite for available items in category
CREATE INDEX IF NOT EXISTS idx_menu_items_category_available ON menu_items(category_id, is_available);

-- ===========================================
-- TRANSACTIONS TABLE INDEXES
-- ===========================================

-- Index for date range queries (analytics)
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at DESC);

-- Index for payment method filtering
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- ===========================================
-- CUSTOMERS TABLE INDEXES
-- ===========================================

-- Index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Index for loyalty points queries
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points DESC);

-- ===========================================
-- CATEGORIES TABLE INDEXES
-- ===========================================

-- Index for sorting categories
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ===========================================
-- WAITER CALLS TABLE INDEXES
-- ===========================================

-- Index for pending calls
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);

-- Index for table-specific calls
CREATE INDEX IF NOT EXISTS idx_waiter_calls_table ON waiter_calls(table_number, status);
```

## Connection Pooling

Supabase provides free connection pooling via PgBouncer. Use the pooled connection string for:
- Edge Functions
- High-traffic API endpoints
- Serverless deployments

**Transaction mode** (default): Best for most queries
**Session mode**: Use when you need prepared statements

## Query Optimization Tips

### 1. Use Partial Indexes for Common Filters

```sql
-- Only index pending orders (common query)
CREATE INDEX IF NOT EXISTS idx_orders_pending 
ON orders(created_at DESC) 
WHERE status = 'pending';

-- Only index available menu items
CREATE INDEX IF NOT EXISTS idx_menu_available 
ON menu_items(category_id, name) 
WHERE is_available = true;
```

### 2. Limit Result Sets

Always use LIMIT for list queries:
```sql
-- Instead of fetching all orders
SELECT * FROM orders WHERE status = 'pending' LIMIT 50;
```

### 3. Select Only Needed Columns

```sql
-- Instead of SELECT *
SELECT id, name, price, image_url FROM menu_items WHERE is_available = true;
```

### 4. Use Batch Inserts

```sql
-- Insert multiple rows in one query
INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES
  ('order-1', 'item-1', 2),
  ('order-1', 'item-2', 1),
  ('order-1', 'item-3', 3);
```

## Monitoring Queries

Use Supabase Dashboard → Database → Query Performance to identify slow queries.

### Common Issues:
1. **Missing index**: Add index for frequently filtered columns
2. **Sequential scan on large table**: Check if WHERE clause uses indexed column
3. **Too many rows returned**: Add LIMIT or pagination

## Vacuum and Analyze

Supabase handles VACUUM automatically, but you can run ANALYZE manually after large data imports:

```sql
ANALYZE orders;
ANALYZE menu_items;
ANALYZE transactions;
```

## Estimated Performance Gains

| Optimization | Impact |
|--------------|--------|
| Status index on orders | 10-50x faster order queries |
| Date index on transactions | 20-100x faster analytics |
| Phone index on customers | 50-200x faster lookups |
| Connection pooling | 3-5x more concurrent users |
| Partial indexes | 2-5x smaller index size |

## Capacity After Optimization

With these optimizations, your Supabase free tier can handle:
- **500MB database**: ~50,000 orders + ~500 menu items
- **Unlimited API calls**: No request limits
- **50,000 MAU auth**: Enough for large customer base
- **Real-time subscriptions**: Up to 200 concurrent connections

Combined with Cloudflare Pages + R2, you can serve **100,000+ monthly customers for FREE**.
