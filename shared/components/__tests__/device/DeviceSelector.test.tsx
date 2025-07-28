import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceSelector } from '../../device/DeviceSelector';
import { ThemeProvider } from '../../theme/ThemeProvider';

const mockOnDeviceSelect = jest.fn();

describe('DeviceSelector', () => {
  const renderDeviceSelector = (props = {}) => {
    return render(
      <ThemeProvider>
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect}
          {...props}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders device categories correctly', () => {
    renderDeviceSelector();
    
    expect(screen.getByText(/Apple Devices/i)).toBeInTheDocument();
    expect(screen.getByText(/PC & Laptops/i)).toBeInTheDocument();
    expect(screen.getByText(/Android Devices/i)).toBeInTheDocument();
    expect(screen.getByText(/Gaming Consoles/i)).toBeInTheDocument();
  });

  it('shows category details on hover', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    const appleCategory = screen.getByText(/Apple Devices/i).closest('div');
    await user.hover(appleCategory!);
    
    await waitFor(() => {
      expect(screen.getByText(/iPhone, iPad, MacBook/i)).toBeInTheDocument();
    });
  });

  it('selects a device category', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    expect(screen.getByText(/Select Your Apple Device/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone/i)).toBeInTheDocument();
    expect(screen.getByText(/iPad/i)).toBeInTheDocument();
    expect(screen.getByText(/MacBook/i)).toBeInTheDocument();
  });

  it('navigates back to categories', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Select Apple category
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    // Click back button
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    
    // Should be back at categories
    expect(screen.getByText(/PC & Laptops/i)).toBeInTheDocument();
    expect(screen.queryByText(/Select Your Apple Device/i)).not.toBeInTheDocument();
  });

  it('selects a specific device model', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Select Apple category
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    // Select iPhone
    const iphoneOption = screen.getByText(/iPhone/i).closest('button');
    await user.click(iphoneOption!);
    
    // Should show model selection
    expect(screen.getByText(/Select iPhone Model/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 15 Pro Max/i)).toBeInTheDocument();
  });

  it('searches for device models', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Select Apple category
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    // Select iPhone
    const iphoneOption = screen.getByText('iPhone').closest('button');
    await user.click(iphoneOption!);
    
    // Search for specific model
    const searchInput = screen.getByPlaceholderText(/Search models/i);
    await user.type(searchInput, '14 Pro');
    
    // Should filter results
    expect(screen.getByText(/iPhone 14 Pro/i)).toBeInTheDocument();
    expect(screen.queryByText(/iPhone 13/i)).not.toBeInTheDocument();
  });

  it('completes device selection flow', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Navigate through selection
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    const iphoneOption = screen.getByText('iPhone').closest('button');
    await user.click(iphoneOption!);
    
    const modelOption = screen.getByText(/iPhone 15 Pro Max/i).closest('button');
    await user.click(modelOption!);
    
    // Verify callback was called with correct data
    expect(mockOnDeviceSelect).toHaveBeenCalledWith({
      category: 'apple',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      year: 2023
    });
  });

  it('shows popular devices section', () => {
    renderDeviceSelector();
    
    expect(screen.getByText(/Popular Devices/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 15 Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Samsung Galaxy S24/i)).toBeInTheDocument();
  });

  it('selects from popular devices', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    const popularDevice = screen.getAllByText(/iPhone 15 Pro/i)[0].closest('button');
    await user.click(popularDevice!);
    
    expect(mockOnDeviceSelect).toHaveBeenCalledWith({
      category: 'apple',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      year: 2023
    });
  });

  it('handles pre-selected device', () => {
    const selectedDevice = {
      category: 'apple',
      brand: 'Apple',
      model: 'iPhone 15',
      year: 2023
    };
    
    renderDeviceSelector({ selectedDevice });
    
    expect(screen.getByText(/iPhone 15/i)).toBeInTheDocument();
    expect(screen.getByText(/Change Device/i)).toBeInTheDocument();
  });

  it('clears selected device', async () => {
    const selectedDevice = {
      category: 'apple',
      brand: 'Apple',
      model: 'iPhone 15',
      year: 2023
    };
    
    renderDeviceSelector({ selectedDevice });
    const user = userEvent.setup();
    
    const changeButton = screen.getByText(/Change Device/i);
    await user.click(changeButton);
    
    // Should be back at category selection
    expect(screen.getByText(/PC & Laptops/i)).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Navigate to model selection
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    const iphoneOption = screen.getByText('iPhone').closest('button');
    await user.click(iphoneOption!);
    
    // Search for non-existent model
    const searchInput = screen.getByPlaceholderText(/Search models/i);
    await user.type(searchInput, 'xyz123');
    
    expect(screen.getByText(/No models found/i)).toBeInTheDocument();
  });

  it('displays year badges for models', async () => {
    renderDeviceSelector();
    const user = userEvent.setup();
    
    // Navigate to model selection
    const appleCategory = screen.getByText(/Apple Devices/i).closest('button');
    await user.click(appleCategory!);
    
    const iphoneOption = screen.getByText('iPhone').closest('button');
    await user.click(iphoneOption!);
    
    // Check for year badges
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
  });
});