/**
 * Higher-order function for API route error handling with logging
 *
 * This utility wraps API route handlers to provide standardized error handling
 * and logging using the logger service.
 */

import { NextResponse } from 'next/server';
import { logger, createRequestContext } from '@/lib/logger';

/**
 * Type for Next.js API route handlers
 */
type ApiHandler = (req: Request, ...args: unknown[]) => Promise<Response>;

/**
 * Wraps an API route handler with standardized error logging
 *
 * @param handler - The API route handler function to wrap
 * @returns A wrapped handler with error logging
 */
export function withErrorLogging(handler: ApiHandler): ApiHandler {
  return async (req: Request, ...args: unknown[]) => {
    try {
      // Execute the original handler
      return await handler(req, ...args);
    } catch (error) {
      // Extract error details
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Create request context for logging
      const context = {
        ...createRequestContext(req),
        stack: errorStack
      };

      // Log the error with Pino
      logger.error(context, `API Error: ${errorMessage}`);

      // Return appropriate error response
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a custom error response with logging
 *
 * @param req - The request object
 * @param message - Error message to return to the client
 * @param status - HTTP status code
 * @param errorDetails - Additional error details for logging
 * @returns NextResponse with error details
 */
export async function createErrorResponse(
  req: Request,
  message: string,
  status = 400,
  errorDetails?: Record<string, unknown>
): Promise<Response> {
  // Log the error with Pino
  logger.error(
    {
      ...createRequestContext(req),
      status,
      ...errorDetails
    },
    message
  );

  // Return formatted error response
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a validation error response without logging as an error
 *
 * Validation errors are expected user input issues, not system errors,
 * so they should be logged as usage/info rather than errors.
 *
 * @param req - The request object
 * @param message - Validation error message to return to the client
 * @param validationIssues - Zod validation issues for field-specific errors
 * @returns NextResponse with validation error details
 */
export async function createValidationResponse(
  req: Request,
  message: string,
  validationIssues?: Array<{ path: (string | number)[]; message: string }>
): Promise<Response> {
  // Log as info, not as an error (validation is expected user behavior)
  logger.info(
    {
      ...createRequestContext(req),
      issueCount: validationIssues?.length || 0
    },
    `Validation failed: ${message}`
  );

  // Format field errors using pattern: { errors: { field: message } }
  const serverErrors = Object.fromEntries(
    validationIssues?.map((issue) => [issue.path[0], issue.message]) || []
  );

  // Return formatted validation response with field errors
  return NextResponse.json(
    {
      errors: serverErrors
    },
    { status: 400 }
  );
}
