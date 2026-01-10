import { z } from 'zod';
import { logger } from './loggerService';

export const validationService = {
  validate<T>(schema: z.Schema<T>, data: any, context: string): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      logger.warn(`[Validation] [${context}] Data integrity issue detected:`, {
        errors: result.error.issues,
        data: data
      });
      // For now, we return data as T but log the warning.
      // In a more mature phase, we might throw or return a default object.
      return data as T;
    }
    return result.data;
  }
};
