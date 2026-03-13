'use client';

/**
 * ErrorBoundary component for catching and handling React errors
 *
 * This component catches errors in the React component tree,
 * logs them using the logger service, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  /**
   * The children to be rendered inside the error boundary
   */
  children: ReactNode;

  /**
   * Optional custom fallback UI to display when an error occurs
   */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  /**
   * Whether an error has been caught
   */
  hasError: boolean;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  /**
   * Update state so the next render will show the fallback UI
   */
  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /**
   * Log the error to our logging system
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error with Pino
    logger.error(
      {
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      `React Error Boundary: ${error.message}`
    );
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI or default error message
      return (
        this.props.fallback || (
          <Alert variant="destructive" className="my-4 mx-auto max-w-md">
            <AlertDescription>
              Something went wrong. The error has been logged. Please try
              refreshing the page.
            </AlertDescription>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}
