// utils/serialize.ts
export function serialize<T = any>(data: Record<string, any>): T {
  if (!data || typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => serialize(item)) as T;
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    // Transforme snake_case -> camelCase
    const newKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      acc[newKey] = serialize(value);
    } else {
      acc[newKey] = value;
    }
    
    return acc;
  }, {} as any) as T;
}

// Pour les requêtes vers la DB (camelCase -> snake_case)
export function deserialize<T = any>(data: Record<string, any>): T {
  if (!data || typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => deserialize(item)) as T;
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    // Transforme camelCase -> snake_case
    const newKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      acc[newKey] = deserialize(value);
    } else {
      acc[newKey] = value;
    }
    
    return acc;
  }, {} as any) as T;
}