/**
 * Shared validation utilities for API routes
 */

import { ZodError } from 'zod';
import { createValidationResponse } from './withErrorLogging';

/**
 * Handles Zod validation errors and returns a standardized response
 *
 * @param request - The request object for logging context
 * @param validationError - The Zod validation error
 * @returns Promise<Response> - Formatted validation error response
 */
export async function handleValidationError(
  request: Request,
  validationError: ZodError
): Promise<Response> {
  // Format validation errors with field names
  const errorMessages = validationError.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'field';
    return `${field}: ${issue.message}`;
  });

  return createValidationResponse(
    request,
    `Validation errors:\n${errorMessages.join('\n')}`,
    validationError.issues
  );
}
