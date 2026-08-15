import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

describe('LoadingSpinner Component', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).to.exist;
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).to.exist;
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    
    expect(screen.getByText('Please wait...')).to.exist;
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    
    const spinner = container.querySelector('.h-4.w-4');
    expect(spinner).to.exist;
  });

  it('should render with medium size (default)', () => {
    const { container } = render(<LoadingSpinner size="md" />);
    
    const spinner = container.querySelector('.h-8.w-8');
    expect(spinner).to.exist;
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    
    const spinner = container.querySelector('.h-12.w-12');
    expect(spinner).to.exist;
  });

  it('should not render text when text prop is empty', () => {
    render(<LoadingSpinner text="" />);
    
    expect(screen.queryByText('Loading...')).to.not.exist;
  });

  it('should have proper CSS classes for spinning animation', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).to.exist;
    expect(spinner).to.have.class('border-2');
    expect(spinner).to.have.class('border-gray-300');
    expect(spinner).to.have.class('border-t-blue-600');
  });

  it('should be centered in flex container', () => {
    const { container } = render(<LoadingSpinner />);
    
    const containerDiv = container.querySelector('.flex');
    expect(containerDiv).to.exist;
    expect(containerDiv).to.have.class('items-center');
    expect(containerDiv).to.have.class('justify-center');
  });
});