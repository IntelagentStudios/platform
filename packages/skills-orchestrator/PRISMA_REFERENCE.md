# Prisma Reference Guide for Intelagent Platform

## Overview
This document provides a quick reference for Prisma syntax, common patterns, and specific conventions used in the Intelagent Platform to help prevent common errors during development and deployment.

## Table Schema Reference

### Main Tables Used in Skills Orchestrator

```typescript
// executions table
interface Execution {
  id: string;
  license_key: string;
  execution_type: string;
  execution_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  input_data?: any; // JSON
  output_data?: any; // JSON
  error_message?: string;
  error_data?: any; // JSON
  cost_usd?: number;
  tokens_used?: number;
  metadata?: any; // JSON
  created_at: Date;
  updated_at: Date;
}

// execution_events table
interface ExecutionEvent {
  id: string;
  execution_id: string;
  event_type: string;
  event_name?: string;
  event_data?: any; // JSON
  timestamp: Date;
  metadata?: any; // JSON
}

// execution_metrics table
interface ExecutionMetric {
  id: string;
  execution_id: string;
  metric_name: string;
  metric_value: number;
  unit?: string;
  timestamp: Date;
}

// data_flows table
interface DataFlow {
  id: string;
  execution_id: string;
  flow_type: string;
  source?: string;
  destination?: string;
  data_size?: number;
  contains_pii: boolean;
  encryption_used: boolean;
  timestamp: Date;
}

// platform_insights table
interface PlatformInsight {
  id: string;
  license_key: string;
  insight_type: string;
  title: string;
  description?: string;
  severity: string;
  confidence: number;
  data?: any; // JSON
  actions?: any; // JSON
  metadata?: any; // JSON
  acted_on: boolean;
  acted_at?: Date;
  created_at: Date;
}
```

## Common Prisma Patterns

### 1. Basic CRUD Operations

```typescript
// CREATE
const execution = await prisma.executions.create({
  data: {
    license_key: licenseKey,
    execution_type: 'skill',
    status: 'pending',
    input_data: params,
    created_at: new Date(),
    updated_at: new Date()
  }
});

// READ
const execution = await prisma.executions.findUnique({
  where: { id: executionId }
});

const executions = await prisma.executions.findMany({
  where: {
    license_key: licenseKey,
    status: 'completed'
  },
  orderBy: { created_at: 'desc' },
  take: 10
});

// UPDATE
const updated = await prisma.executions.update({
  where: { id: executionId },
  data: {
    status: 'completed',
    completed_at: new Date(),
    output_data: result,
    updated_at: new Date()
  }
});

// DELETE
await prisma.executions.delete({
  where: { id: executionId }
});
```

### 2. Working with Relations

```typescript
// Include related data
const executionWithEvents = await prisma.executions.findUnique({
  where: { id: executionId },
  include: {
    execution_events: true,
    execution_metrics: true,
    data_flows: true
  }
});

// Create with relations
const execution = await prisma.executions.create({
  data: {
    license_key: licenseKey,
    execution_type: 'workflow',
    status: 'running',
    execution_events: {
      create: {
        event_type: 'started',
        event_name: 'workflow_start',
        timestamp: new Date()
      }
    }
  },
  include: {
    execution_events: true
  }
});
```

### 3. Filtering and Queries

```typescript
// Date range filtering
const recentExecutions = await prisma.executions.findMany({
  where: {
    license_key: licenseKey,
    created_at: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      lte: new Date()
    }
  }
});

// Multiple conditions
const failedExecutions = await prisma.executions.findMany({
  where: {
    AND: [
      { license_key: licenseKey },
      { status: 'failed' },
      {
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    ]
  }
});

// OR conditions
const pendingOrRunning = await prisma.executions.findMany({
  where: {
    license_key: licenseKey,
    OR: [
      { status: 'pending' },
      { status: 'running' }
    ]
  }
});

// Count operations
const count = await prisma.executions.count({
  where: {
    license_key: licenseKey,
    status: 'failed'
  }
});
```

### 4. Aggregations

```typescript
// Group by with aggregations
const stats = await prisma.executions.groupBy({
  by: ['execution_type', 'status'],
  where: {
    license_key: licenseKey
  },
  _count: {
    _all: true
  },
  _avg: {
    duration_ms: true,
    cost_usd: true
  }
});

// Aggregate functions
const metrics = await prisma.executions.aggregate({
  where: {
    license_key: licenseKey,
    status: 'completed'
  },
  _avg: {
    duration_ms: true,
    tokens_used: true
  },
  _sum: {
    cost_usd: true
  },
  _count: {
    _all: true
  }
});
```

### 5. Transactions

```typescript
// Multiple operations in a transaction
const result = await prisma.$transaction(async (tx) => {
  // Update execution
  const execution = await tx.executions.update({
    where: { id: executionId },
    data: { status: 'completed' }
  });
  
  // Create event
  const event = await tx.execution_events.create({
    data: {
      execution_id: executionId,
      event_type: 'completed',
      timestamp: new Date()
    }
  });
  
  // Create metric
  const metric = await tx.execution_metrics.create({
    data: {
      execution_id: executionId,
      metric_name: 'duration',
      metric_value: execution.duration_ms || 0,
      unit: 'ms',
      timestamp: new Date()
    }
  });
  
  return { execution, event, metric };
});
```

### 6. Batch Operations

```typescript
// Create many
await prisma.execution_events.createMany({
  data: events.map(e => ({
    execution_id: executionId,
    event_type: e.type,
    event_data: e.data,
    timestamp: e.timestamp || new Date()
  }))
});

// Update many
await prisma.executions.updateMany({
  where: {
    license_key: licenseKey,
    status: 'pending',
    created_at: {
      lt: new Date(Date.now() - 60 * 60 * 1000) // Older than 1 hour
    }
  },
  data: {
    status: 'failed',
    error_message: 'Execution timeout'
  }
});

// Delete many
await prisma.execution_events.deleteMany({
  where: {
    timestamp: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Older than 30 days
    }
  }
});
```

## Common Pitfalls and Solutions

### 1. Type Mismatches
**Problem**: TypeScript errors when fields don't match Prisma schema
**Solution**: Always check the schema.prisma file for exact field names and types

```typescript
// WRONG - using wrong field names
await prisma.executions.create({
  data: {
    licenseKey: key, // Should be license_key
    executionType: type, // Should be execution_type
    createdAt: new Date() // Should be created_at
  }
});

// CORRECT
await prisma.executions.create({
  data: {
    license_key: key,
    execution_type: type,
    created_at: new Date()
  }
});
```

### 2. JSON Fields
**Problem**: JSON fields need proper typing
**Solution**: Use Prisma.JsonValue or proper typing

```typescript
// For JSON fields
import { Prisma } from '@prisma/client';

const metadata: Prisma.JsonValue = {
  key: 'value',
  nested: { data: true }
};

await prisma.executions.create({
  data: {
    license_key: key,
    execution_type: 'skill',
    metadata // JSON field
  }
});
```

### 3. Optional vs Required Fields
**Problem**: Missing required fields or wrong assumptions about optionality
**Solution**: Check schema for required fields (no ? in type)

```typescript
// Check schema.prisma to see which fields are optional
// Required fields don't have ? in the schema
// Optional fields have ? in the schema

// Example: execution_name is optional, license_key is required
await prisma.executions.create({
  data: {
    license_key: key, // Required
    execution_type: 'skill', // Required
    execution_name: name, // Optional - can be omitted
    status: 'pending' // Required
  }
});
```

### 4. Date Handling
**Problem**: Date fields need proper Date objects
**Solution**: Always use Date objects, not strings

```typescript
// WRONG
await prisma.executions.update({
  where: { id },
  data: {
    started_at: '2024-01-01' // String - will cause error
  }
});

// CORRECT
await prisma.executions.update({
  where: { id },
  data: {
    started_at: new Date('2024-01-01')
  }
});
```

### 5. Undefined Values
**Problem**: Prisma doesn't accept undefined for updates
**Solution**: Use conditional spreading or Prisma.DbNull

```typescript
// WRONG - undefined will cause issues
await prisma.executions.update({
  where: { id },
  data: {
    error_message: undefined // Will cause error
  }
});

// CORRECT - use conditional spreading
const updates: any = {};
if (errorMessage !== undefined) {
  updates.error_message = errorMessage;
}

await prisma.executions.update({
  where: { id },
  data: updates
});

// Or use null for clearing values
await prisma.executions.update({
  where: { id },
  data: {
    error_message: null // Clears the field
  }
});
```

## Best Practices

1. **Always handle errors**: Wrap Prisma calls in try-catch blocks
2. **Use transactions**: For related operations that must succeed together
3. **Limit query results**: Use `take` to prevent fetching too much data
4. **Index frequently queried fields**: Check schema.prisma for indexes
5. **Use select for efficiency**: Only fetch fields you need
6. **Batch operations**: Use createMany, updateMany for bulk operations
7. **Clean up old data**: Implement data retention policies

## Quick Debug Checklist

When you get Prisma errors:

1. ✅ Check field names match schema exactly (snake_case vs camelCase)
2. ✅ Check field types match schema (string, number, Date, JSON)
3. ✅ Check required vs optional fields
4. ✅ Check if using correct table name (plural in Prisma)
5. ✅ Check Date objects vs strings
6. ✅ Check JSON field formatting
7. ✅ Check if Prisma client is generated (`npx prisma generate`)
8. ✅ Check database connection string
9. ✅ Check if migrations are applied (`npx prisma migrate deploy`)
10. ✅ Check TypeScript types match Prisma generated types

## Environment Variables

Required for Prisma:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

## Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

Keep this document handy when working with Prisma in the Intelagent Platform!