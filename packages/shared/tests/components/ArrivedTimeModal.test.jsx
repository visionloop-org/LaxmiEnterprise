import { expect } from 'chai';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ArrivedTimeModal from '../../components/ArrivedTimeModal.jsx';

describe('ArrivedTimeModal Component', () => {
  const mockEmployee = {
    id: 'EMP001',
    employeeId: 'EMP001',
    name: 'John Doe'
  };

  const mockOnClose = () => {};
  const mockOnConfirm = () => {};

  it('should not render when isOpen is false', () => {
    render(
      <ArrivedTimeModal 
        isOpen={false} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(screen.queryByText('Set Arrival Time')).to.not.exist;
  });

  it('should not render when employee is null', () => {
    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={null} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(screen.queryByText('Set Arrival Time')).to.not.exist;
  });

  it('should render modal when isOpen is true and employee is provided', () => {
    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(screen.getByText('Set Arrival Time')).to.exist;
    expect(container.textContent).to.include('John Doe');
    expect(container.textContent).to.include('EMP001');
  });

  it('should display quick time presets', () => {
    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(screen.getByText('Now')).to.exist;
    expect(screen.getByText('08:00 AM')).to.exist;
    expect(screen.getByText('08:30 AM')).to.exist;
    expect(screen.getByText('09:00 AM')).to.exist;
    expect(screen.getByText('09:30 AM')).to.exist;
    expect(screen.getByText('10:00 AM')).to.exist;
  });

  it('should select time when quick preset is clicked', () => {
    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const nowButton = screen.getByText('Now');
    fireEvent.click(nowButton);

    const timeInput = container.querySelector('input[type="time"]');
    expect(timeInput).to.exist;
    expect(timeInput.value).to.match(/^\d{2}:\d{2}$/);
  });

  it('should update time when custom time input is changed', () => {
    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const timeInput = container.querySelector('input[type="time"]');
    fireEvent.change(timeInput, { target: { value: '11:30' } });

    expect(timeInput.value).to.equal('11:30');
  });

  it('should update remarks when remarks input is changed', () => {
    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const remarksInput = screen.getByPlaceholderText('e.g. Traffic delay, permission approved...');
    fireEvent.change(remarksInput, { target: { value: 'Traffic delay' } });

    expect(remarksInput.value).to.equal('Traffic delay');
  });

  it('should call onClose when cancel button is clicked', () => {
    let onCloseCalled = false;
    const handleClose = () => { onCloseCalled = true; };

    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={handleClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCloseCalled).to.be.true;
  });

  it('should call onClose when close button (X) is clicked', () => {
    let onCloseCalled = false;
    const handleClose = () => { onCloseCalled = true; };

    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={handleClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(onCloseCalled).to.be.true;
  });

  it('should call onConfirm with correct data when confirm button is clicked', () => {
    let confirmData = null;
    const handleConfirm = (data) => { confirmData = data; };
    let onCloseCalled = false;
    const handleClose = () => { onCloseCalled = true; };

    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={handleClose} 
        onConfirm={handleConfirm} 
      />
    );

    const confirmButton = screen.getByText('Confirm Arrival');
    fireEvent.click(confirmButton);

    expect(confirmData).to.exist;
    expect(confirmData.employeeId).to.equal('EMP001');
    expect(confirmData.arrivalTime).to.include('T');
    expect(confirmData.remarks).to.include('Arrived at');
    expect(onCloseCalled).to.be.true;
  });

  it('should use custom remarks if provided', () => {
    let confirmData = null;
    const handleConfirm = (data) => { confirmData = data; };
    let onCloseCalled = false;
    const handleClose = () => { onCloseCalled = true; };

    render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={handleClose} 
        onConfirm={handleConfirm} 
      />
    );

    const remarksInput = screen.getByPlaceholderText('e.g. Traffic delay, permission approved...');
    fireEvent.change(remarksInput, { target: { value: 'Custom remark' } });

    const confirmButton = screen.getByText('Confirm Arrival');
    fireEvent.click(confirmButton);

    expect(confirmData.remarks).to.equal('Custom remark');
  });

  it('should initialize with current time', () => {
    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={mockEmployee} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    const timeInput = container.querySelector('input[type="time"]');
    expect(timeInput).to.exist;
    
    // Verify it's in HH:MM format
    const timeValue = timeInput.value;
    expect(timeValue).to.match(/^\d{2}:\d{2}$/);
  });

  it('should display both employee ID and name when both are available', () => {
    const employeeWithBoth = {
      id: 'EMP001',
      employeeId: 'EMP001',
      name: 'John Doe'
    };

    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={employeeWithBoth} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(container.textContent).to.include('John Doe');
    expect(container.textContent).to.include('EMP001');
  });

  it('should handle employee with only id', () => {
    const employeeWithId = {
      id: 'EMP002',
      name: 'Jane Smith'
    };

    const { container } = render(
      <ArrivedTimeModal 
        isOpen={true} 
        employee={employeeWithId} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm} 
      />
    );

    expect(container.textContent).to.include('Jane Smith');
    expect(container.textContent).to.include('EMP002');
  });
});