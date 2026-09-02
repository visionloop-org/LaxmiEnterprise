import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';
import { NetworkError, AuthError, ValidationError, ConflictError, APIError } from '../../services/backendApi.js';

describe('ErrorBoundary Component', () => {
  const ThrowError = ({ error }) => {
    throw error;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).to.exist;
  });

  it('should catch and display error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).to.exist;
    expect(screen.getByText('Test error')).to.exist;
  });

  it('should display NetworkError message correctly', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new NetworkError('Network error')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Network connection or backend service unavailable. Please check your connection.')).to.exist;
  });

  it('should display AuthError message correctly', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new AuthError('Unauthorized')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Session expired or unauthorized. Please log in again.')).to.exist;
    expect(screen.queryByText('Retry Action')).to.not.exist;
    expect(screen.getByText('Reload Application')).to.exist;
  });

  it('should display ValidationError message correctly', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new ValidationError('Validation failed')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Validation error. Please verify the submitted data.')).to.exist;
  });

  it('should display ConflictError message correctly', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new ConflictError('Conflict detected')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Data conflict detected. The record was modified by another user.')).to.exist;
  });

  it('should display request ID when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new APIError('Test error', 500, 'TEST_CODE', null, 'req-123')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Request ID: req-123')).to.exist;
  });

  it('should show retry button for retryable errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new NetworkError('Network error')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Retry Action')).to.exist;
  });

  it('should reset error state when retry button is clicked', () => {
    let shouldThrow = true;
    const BuggyComponent = () => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Normal Content</div>;
    };

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).to.exist;

    shouldThrow = false;
    const retryButton = screen.getByText('Retry Action');
    fireEvent.click(retryButton);

    expect(screen.getByText('Normal Content')).to.exist;
  });

  it('should toggle error details when diagnostics button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new APIError('Test error', 500, 'TEST_CODE', { detail: 'Test details' })} />
      </ErrorBoundary>
    );

    const diagnosticsButton = screen.getByText('View Diagnostics');
    expect(diagnosticsButton).to.exist;

    // Click to show details
    fireEvent.click(diagnosticsButton);
    expect(screen.getByText('Hide Diagnostics')).to.exist;
    expect(screen.getByText('Error: APIError')).to.exist;
    expect(screen.getByText('Message: Test error')).to.exist;
    expect(screen.getByText('Code: TEST_CODE')).to.exist;
    expect(screen.getByText('Status: 500')).to.exist;

    // Click to hide details
    fireEvent.click(screen.getByText('Hide Diagnostics'));
    expect(screen.getByText('View Diagnostics')).to.exist;
    expect(screen.queryByText('Error: APIError')).to.not.exist;
  });

  it('should handle errors without requestId', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Request ID:')).to.not.exist;
  });

  it('should log error to console', () => {
    const originalError = console.error;
    let errorLogged = false;
    console.error = () => { errorLogged = true; };

    render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(errorLogged).to.be.true;
    console.error = originalError;
  });
});