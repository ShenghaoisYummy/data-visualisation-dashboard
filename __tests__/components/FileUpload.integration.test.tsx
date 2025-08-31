import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/FileUpload';

// Mock the fetch API
global.fetch = jest.fn();

// Mock file for testing
const createMockFile = (name: string, type: string, content: string) => {
  const file = new File([content], name, { type });
  return file;
};

describe('FileUpload Component Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should handle successful file upload', async () => {
    const user = userEvent.setup();
    const mockOnUploadComplete = jest.fn();

    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'File uploaded successfully',
        batchId: 'batch-123',
        productsProcessed: 10,
      }),
    });

    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);

    // Find file input
    const fileInput = screen.getByLabelText(/select excel file/i);
    
    // Create mock Excel file
    const mockFile = createMockFile('test-data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'mock excel content');
    
    // Upload file
    await user.upload(fileInput, mockFile);
    
    // Find and click upload button
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    await user.click(uploadButton);

    // Wait for API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }));
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).toHaveBeenCalledWith({
      success: true,
      batchId: 'batch-123',
      productsProcessed: 10,
    });
  });

  it('should handle upload errors gracefully', async () => {
    const user = userEvent.setup();
    const mockOnUploadComplete = jest.fn();

    // Mock API error response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        success: false,
        message: 'Invalid file format',
        details: 'File must be an Excel (.xlsx) file',
      }),
    });

    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);

    const fileInput = screen.getByLabelText(/select excel file/i);
    const mockFile = createMockFile('test-data.txt', 'text/plain', 'invalid content');
    
    await user.upload(fileInput, mockFile);
    
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    await user.click(uploadButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });

  it('should show loading state during upload', async () => {
    const user = userEvent.setup();
    
    // Mock delayed API response
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }), 100)
      )
    );

    render(<FileUpload onUploadComplete={jest.fn()} />);

    const fileInput = screen.getByLabelText(/select excel file/i);
    const mockFile = createMockFile('test-data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content');
    
    await user.upload(fileInput, mockFile);
    
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    await user.click(uploadButton);

    // Check loading state
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
    });
  });

  it('should validate file types', async () => {
    const user = userEvent.setup();
    
    render(<FileUpload onUploadComplete={jest.fn()} />);

    const fileInput = screen.getByLabelText(/select excel file/i);
    const invalidFile = createMockFile('document.pdf', 'application/pdf', 'pdf content');
    
    await user.upload(fileInput, invalidFile);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please select a valid excel file/i)).toBeInTheDocument();
    });

    // Upload button should be disabled
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    expect(uploadButton).toBeDisabled();
  });
});