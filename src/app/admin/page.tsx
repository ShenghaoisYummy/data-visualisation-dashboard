'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvitationCodeSchema, type CreateInvitationCodeInput } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

interface InvitationCode {
  id: string;
  code: string;
  department: string | null;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiresAt: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

export default function AdminPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createInvitationCodeSchema),
    defaultValues: {
      maxUses: 10,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      department: undefined,
      description: undefined,
      prefix: undefined
    }
  });

  // Fetch invitation codes
  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/invitation-codes');
      const result = await response.json();
      
      if (result.success) {
        setCodes(result.codes);
      } else {
        setServerError('Failed to load invitation codes');
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
      setServerError('Error loading invitation codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Create new invitation code
  const onSubmit = async (data: CreateInvitationCodeInput) => {
    setIsCreating(true);
    setServerError('');

    try {
      const response = await fetch('/api/admin/invitation-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setCodes(prev => [result.code, ...prev]);
        reset();
        setShowCreateForm(false);
      } else {
        setServerError(result.message || 'Failed to create invitation code');
      }
    } catch (error) {
      console.error('Error creating code:', error);
      setServerError('Error creating invitation code');
    } finally {
      setIsCreating(false);
    }
  };

  // Deactivate invitation code
  const deactivateCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to deactivate this invitation code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invitation-codes/${codeId}/deactivate`, {
        method: 'PUT',
      });

      const result = await response.json();

      if (result.success) {
        setCodes(prev => 
          prev.map(code => 
            code.id === codeId 
              ? { ...code, isActive: false }
              : code
          )
        );
      } else {
        alert('Failed to deactivate invitation code');
      }
    } catch (error) {
      console.error('Error deactivating code:', error);
      alert('Error deactivating invitation code');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Data Visualization Dashboard
              </Link>
              <span className="ml-2 text-sm text-gray-500">/ Admin</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invitation Code Management</h1>
              <p className="text-gray-600">Create and manage invitation codes for staff registration</p>
            </div>
            
            <Button 
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create New Code'}
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Invitation Code</h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Department (Optional)"
                    placeholder="e.g., Store 01, Management"
                    error={errors.department?.message}
                    {...register('department')}
                  />
                  
                  <Input
                    label="Maximum Uses"
                    type="number"
                    min="1"
                    max="100"
                    error={errors.maxUses?.message}
                    {...register('maxUses', { valueAsNumber: true })}
                  />
                  
                  <Input
                    label="Expires At"
                    type="datetime-local"
                    error={errors.expiresAt?.message}
                    {...register('expiresAt')}
                  />
                  
                  <Input
                    label="Code Prefix (Optional)"
                    placeholder="e.g., STORE01"
                    error={errors.prefix?.message}
                    {...register('prefix')}
                  />
                </div>
                
                <Input
                  label="Description (Optional)"
                  placeholder="e.g., Monthly codes for Store 01 staff"
                  error={errors.description?.message}
                  {...register('description')}
                />

                {serverError && (
                  <div className="text-sm text-red-600">{serverError}</div>
                )}
                
                <div className="flex space-x-4">
                  <Button type="submit" loading={isCreating}>
                    Create Code
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Codes List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Invitation Codes ({codes.length})
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : codes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No invitation codes found. Create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {codes.map((code) => (
                      <tr key={code.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {code.code}
                          </div>
                          {code.description && (
                            <div className="text-sm text-gray-500">{code.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.currentUses} / {code.maxUses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            code.isActive && new Date(code.expiresAt) > new Date()
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {code.isActive && new Date(code.expiresAt) > new Date() ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{formatDate(code.expiresAt)}</div>
                          <div className="text-gray-500">({formatRelativeTime(code.expiresAt)})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.isActive && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deactivateCode(code.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}