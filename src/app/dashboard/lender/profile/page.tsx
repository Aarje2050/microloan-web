// app/dashboard/lender/profile/page.tsx - PROFESSIONAL ENTERPRISE PROFILE
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Input, Select } from "@/components/ui/input";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Settings,
  Lock,
  Bell,
  Shield,
  LogOut,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  CreditCard,
  Users,
  RefreshCw
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  business_name: string | null;
  business_type: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  totalBorrowers: number;
  totalLoans: number;
  portfolioValue: number;
  joinedDate: string;
}

type TabType = 'profile' | 'security' | 'notifications' | 'business' | 'data';

export default function LenderProfilePage() {
  const router = useRouter();
  const { user, signOut, isLender, isBoth, initialized, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = React.useState<TabType>('profile');
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [stats, setStats] = React.useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = React.useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    business_name: '',
    business_type: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Auth check
  React.useEffect(() => {
    if (!initialized) return;
    
    if (!isAuthenticated || !isLender) {
      router.replace("/dashboard");
      return;
    }
  }, [initialized, isAuthenticated, isLender, router]);

  // Load profile data
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadProfileData();
  }, [user, isLender]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      console.log("📊 Loading profile data for user:", user?.id);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (userError) throw userError;

      // Get additional profile data (if exists)
      let profileData = null;
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();
        profileData = profile;
      } catch (profileError) {
        console.log("⚠️ User profiles table might not exist:", profileError);
      }

      // Combine data
      const combinedProfile: UserProfile = {
        id: userData.id,
        full_name: userData.full_name || '',
        email: userData.email,
        phone: userData.phone || profileData?.phone || null,
        address: profileData?.address || null,
        city: profileData?.city || null,
        state: profileData?.state || null,
        pincode: profileData?.pincode || null,
        business_name: profileData?.business_name || null,
        business_type: profileData?.business_type || null,
        roles: userData.roles || [userData.role],
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      setProfile(combinedProfile);
      setFormData({
        full_name: combinedProfile.full_name,
        phone: combinedProfile.phone || '',
        address: combinedProfile.address || '',
        city: combinedProfile.city || '',
        state: combinedProfile.state || '',
        pincode: combinedProfile.pincode || '',
        business_name: combinedProfile.business_name || '',
        business_type: combinedProfile.business_type || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      // Load stats
      await loadStats();

    } catch (error) {
      console.error("❌ Failed to load profile data:", error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get borrowers count
      const { data: borrowersData } = await supabase
        .from("borrowers")
        .select("id")
        .eq("lender_id", user?.id);

      // Get loans data
      const { data: loansData } = await supabase
        .from("loans")
        .select("principal_amount, total_amount")
        .eq("created_by", user?.id);

      const portfolioValue = (loansData || []).reduce(
        (sum, loan) => sum + (loan.total_amount || loan.principal_amount),
        0
      );

      setStats({
        totalBorrowers: (borrowersData || []).length,
        totalLoans: (loansData || []).length,
        portfolioValue,
        joinedDate: profile?.created_at || new Date().toISOString(),
      });

    } catch (error) {
      console.error("❌ Failed to load stats:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user?.id);

      if (userError) throw userError;

      // Update or insert user profile
      const profileUpdate = {
        user_id: user?.id,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        business_name: formData.business_name || null,
        business_type: formData.business_type || null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profileUpdate);

      if (profileError) {
        console.log("⚠️ User profiles table might not exist:", profileError);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      await loadProfileData();

    } catch (error) {
      console.error("❌ Failed to save profile:", error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (formData.new_password !== formData.confirm_password) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }

      if (formData.new_password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
      }

      setIsSaving(true);
      setMessage(null);

      const { error } = await supabase.auth.updateUser({
        password: formData.new_password
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));

    } catch (error: any) {
      console.error("❌ Failed to change password:", error);
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      router.replace("/login");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const businessTypeOptions = [
    { value: '', label: 'Select Business Type' },
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_limited', label: 'Private Limited' },
    { value: 'public_limited', label: 'Public Limited' },
    { value: 'llp', label: 'Limited Liability Partnership' },
    { value: 'other', label: 'Other' }
  ];

  if (!initialized || !isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile & Settings">
      <div className="bg-gray-50 min-h-screen">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'L'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.full_name || 'Loading...'}
                  </h1>
                  <p className="text-gray-600">{profile?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Briefcase className="w-3 h-3 mr-1" />
                      Lender
                    </span>
                    {isBoth && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Users className="w-3 h-3 mr-1" />
                        Multi-Role
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {isBoth && (
                  <button
                    onClick={() => router.push("/dashboard/borrower")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    Switch to Borrower
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-center"
                >
                  <LogOut className="w-4 h-4 mr-2 inline" />
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            {stats && !isLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBorrowers}</p>
                  <p className="text-sm text-gray-600">Borrowers</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <CreditCard className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
                  <p className="text-sm text-gray-600">Loans</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.portfolioValue)}</p>
                  <p className="text-sm text-gray-600">Portfolio</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-900">{formatDate(stats.joinedDate)}</p>
                  <p className="text-sm text-gray-600">Member Since</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4">
            <nav className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'business', label: 'Business', icon: Briefcase },
                { id: 'data', label: 'Data & Privacy', icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600 mt-1">Update your personal details and contact information</p>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false);
                        // Reset form data
                        setFormData(prev => ({
                          ...prev,
                          full_name: profile?.full_name || '',
                          phone: profile?.phone || '',
                          address: profile?.address || '',
                          city: profile?.city || '',
                          state: profile?.state || '',
                          pincode: profile?.pincode || ''
                        }));
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isEditing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2 inline" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2 inline" />
                        Edit
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Email Address"
                    value={profile?.email || ''}
                    disabled={true}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    leftIcon={<Phone className="w-4 h-4" />}
                    placeholder="Enter your phone number"
                  />
                  <Input
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    leftIcon={<MapPin className="w-4 h-4" />}
                    placeholder="Enter your address"
                  />
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your city"
                  />
                  <Input
                    label="State"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your state"
                  />
                  <Input
                    label="PIN Code"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter PIN code"
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      <Save className="w-4 h-4 mr-2 inline" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security and password</p>
                </div>
                
                <div className="max-w-md space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    leftIcon={<Lock className="w-4 h-4" />}
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={handlePasswordChange}
                    disabled={isSaving || !formData.new_password || !formData.confirm_password}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

            {/* Business Tab */}
            {activeTab === 'business' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
                    <p className="text-gray-600 mt-1">Manage your business details and lending information</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isEditing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Input
                    label="Business Name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    disabled={!isEditing}
                    leftIcon={<Briefcase className="w-4 h-4" />}
                    placeholder="Enter your business name"
                  />
                  <Select
                    label="Business Type"
                    value={formData.business_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
                    disabled={!isEditing}
                    options={businessTypeOptions}
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      <Save className="w-4 h-4 mr-2 inline" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs placeholder */}
            {(activeTab === 'notifications' || activeTab === 'data') && (
              <div className="p-6 text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600">This section is under development and will be available soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}