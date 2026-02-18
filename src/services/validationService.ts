import { z } from 'zod';
import { logger } from './loggerService';

export const validationService = {
  validate<T>(schema: z.Schema<T>, data: any, context: string): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errorMsg = `[Validation] [${context}] Data integrity failure: ${result.error.message}`;
      logger.error(errorMsg, {
        errors: result.error.issues,
        data: data
      });
      throw new Error(errorMsg);
    }
    return result.data;
  }
};
