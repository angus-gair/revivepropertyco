/**
 * Customer Portal Profile Management Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Edit,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { getCustomerProfile, updateCustomerProfile, changeCustomerPassword } from '../../services/customerService';
import type { Customer } from '../../services/customerService';

const CustomerProfilePage: React.FC = () => {
  const { customer, refreshCustomer } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    mobile: customer?.mobile || '',
    email: customer?.email || '',
    address: customer?.address || '',
    suburb: customer?.suburb || '',
    postcode: customer?.postcode || '',
    state: customer?.state || 'ACT'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: customer.address || '',
        suburb: customer.suburb || '',
        postcode: customer.postcode || '',
        state: customer.state || 'ACT'
      });
    }
  }, [customer]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return;
      }

      if (!formData.mobile && !formData.email) {
        setError('Please provide either a mobile number or email address');
        return;
      }

      // Mobile format validation
      if (formData.mobile) {
        const mobileRegex = /^(\+61|04)[0-9]{8}$/;
        if (!mobileRegex.test(formData.mobile.replace(/[\s]/g, ''))) {
          setError('Invalid mobile number format. Use +61XXXXXXXX or 04XXXXXXXX');
          return;
        }
      }

      // Email format validation
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Invalid email address format');
          return;
        }
      }

      await updateCustomerProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        suburb: formData.suburb || undefined,
        postcode: formData.postcode || undefined,
        state: formData.state
      });

      await refreshCustomer();
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Validation
      if (!passwordData.currentPassword) {
        setError('Current password is required');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      await changeCustomerPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: customer.address || '',
        suburb: customer.suburb || '',
        postcode: customer.postcode || '',
        state: customer.state || 'ACT'
      });
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase mb-4">
            Profile
          </h1>
          <p className="text-neutral-500">
            Manage your account settings and contact information
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-red-900 mb-1">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 flex items-start gap-3">
            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-green-900 mb-1">Success</div>
              <div className="text-sm text-green-700">{success}</div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-600"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-outline-variant shadow-sm">
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center">
                      <User className="text-neutral-400" size={32} />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold tracking-tight">
                        {customer?.firstName} {customer?.lastName}
                      </h2>
                      <p className="text-sm text-neutral-500">
                        {customer?.email || customer?.mobile}
                      </p>
                    </div>
                  </div>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 border border-black font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {editMode ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          FIRST NAME *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          LAST NAME *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          MOBILE NUMBER
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="tel"
                            placeholder="04XXXXXXXX"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          EMAIL ADDRESS
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div>
                      <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                        ADDRESS
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          SUBURB
                        </label>
                        <input
                          type="text"
                          value={formData.suburb}
                          onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                          className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          POSTCODE
                        </label>
                        <input
                          type="text"
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                          className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-display text-[0.65rem] font-bold tracking-widest text-neutral-500 mb-2">
                          STATE
                        </label>
                        <select
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        >
                          <option value="ACT">ACT</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="WA">WA</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="NT">NT</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-black text-white font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-6 py-3 border border-black font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 mb-2">
                          FULL NAME
                        </div>
                        <div className="text-sm">
                          {customer?.firstName} {customer?.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 mb-2">
                          CUSTOMER ID
                        </div>
                        <div className="text-sm font-mono text-neutral-600">
                          {customer?.customerId?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 mb-2">
                          MOBILE
                        </div>
                        <div className="text-sm flex items-center gap-2">
                          <Phone size={16} className="text-neutral-400" />
                          {customer?.mobile || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 mb-2">
                          EMAIL
                        </div>
                        <div className="text-sm flex items-center gap-2">
                          <Mail size={16} className="text-neutral-400" />
                          {customer?.email || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    {(customer?.address || customer?.suburb || customer?.postcode) && (
                      <div>
                        <div className="font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 mb-2">
                          ADDRESS
                        </div>
                        <div className="text-sm flex items-start gap-2">
                          <MapPin size={16} className="text-neutral-400 mt-0.5" />
                          <span>
                            {customer?.address && <div>{customer.address}</div>}
                            {(customer?.suburb || customer?.postcode || customer?.state) && (
                              <div>
                                {[customer.suburb, customer.postcode, customer.state].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-outline-variant shadow-sm">
              <div className="p-6 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-low rounded-full flex items-center justify-center">
                    <Lock className="text-neutral-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold tracking-tight">Password</h3>
                    <p className="text-xs text-neutral-500">Change your password</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full px-4 py-3 border border-black font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-500 mb-2">
                        CURRENT PASSWORD
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-500 mb-2">
                        NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-500 mb-2">
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-black text-white font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Changing...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        disabled={saving}
                        className="px-4 py-3 border border-neutral-200 font-display text-xs font-bold tracking-widest hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-6 bg-white border border-outline-variant shadow-sm">
              <div className="p-6">
                <h3 className="font-display text-sm font-bold tracking-tight mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Account Type</span>
                    <span className="font-medium">Customer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Member Since</span>
                    <span className="font-medium">
                      {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold tracking-wider">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
