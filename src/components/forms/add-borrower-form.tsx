// components/forms/add-borrower-form.tsx - ENHANCED FOR MULTI-TENANT
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  User, Phone, Mail, MapPin, Briefcase, DollarSign, 
  Upload, CreditCard, X, CheckCircle, AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddBorrowerFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  // Only name and email required now
  full_name: string
  email: string
  phone: string
  address: string
  employment_type: string
  monthly_income: string
  credit_score: string
}

interface DocumentFile {
  type: 'aadhar' | 'pan' | 'salary_slip' | 'bank_statement' | 'photo'
  file: File | null
  preview?: string
}

// 🆕 ENHANCED: Multi-tenant email validation interface
interface EmailValidation {
  checking: boolean
  status: 'new' | 'existing_available' | 'existing_assigned' | 'error'
  message: string
  user_id?: string
  can_proceed: boolean
}

export default function AddBorrowerForm({ onSuccess, onCancel }: AddBorrowerFormProps) {
  const { user } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [currentStep, setCurrentStep] = React.useState(1)
  
  // 🆕 ENHANCED: Multi-tenant email validation state
  const [emailValidation, setEmailValidation] = React.useState<EmailValidation>({
    checking: false,
    status: 'new',
    message: '',
    can_proceed: true
  })
  
  const [formData, setFormData] = React.useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    employment_type: 'salaried',
    monthly_income: '',
    credit_score: '650'
  })
  
  const [documents, setDocuments] = React.useState<DocumentFile[]>([
    { type: 'aadhar', file: null },
    { type: 'pan', file: null },
    { type: 'photo', file: null },
    { type: 'salary_slip', file: null }
  ])

  console.log('📝 ADD BORROWER - Component loaded for lender:', user?.email)

  // 🆕 ENHANCED: Multi-tenant email validation
  const checkEmailExists = React.useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({
        checking: false,
        status: 'new',
        message: '',
        can_proceed: true
      })
      return
    }

    console.log('🔍 ENHANCED EMAIL CHECK - Checking email:', email)
    setEmailValidation({
      checking: true,
      status: 'new',
      message: 'Checking email...',
      can_proceed: false
    })

    try {
      // Step 1: Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, role, active')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('❌ EMAIL CHECK - User query error:', userError)
        setEmailValidation({
          checking: false,
          status: 'error',
          message: 'Unable to validate email',
          can_proceed: false
        })
        return
      }

      // Case 1: New user (doesn't exist)
      if (!userData) {
        console.log('✅ EMAIL CHECK - New email, can create user')
        setEmailValidation({
          checking: false,
          status: 'new',
          message: 'New borrower - will create account',
          can_proceed: true
        })
        return
      }

      console.log('📋 EMAIL CHECK - User found:', userData.id, userData.full_name)

      // Step 2: Check if already your borrower
      const { data: borrowerRelation, error: borrowerError } = await supabase
        .from('borrowers')
        .select('id')
        .eq('user_id', userData.id)
        .eq('lender_id', user?.id)
        .single()

      if (borrowerError && borrowerError.code !== 'PGRST116') {
        console.error('❌ EMAIL CHECK - Borrower query error:', borrowerError)
      }

      // Case 2: Already your borrower
      if (borrowerRelation) {
        console.log('ℹ️ EMAIL CHECK - Already your borrower')
        setEmailValidation({
          checking: false,
          status: 'existing_assigned',
          message: `${userData.full_name} is already your borrower - create loans for them instead`,
          user_id: userData.id,
          can_proceed: false
        })
        return
      }

      // Case 3: User exists but not your borrower (MULTI-TENANT!)
      console.log('✅ EMAIL CHECK - Can add existing user as your borrower')
      setEmailValidation({
        checking: false,
        status: 'existing_available',
        message: `${userData.full_name} exists - will add as your borrower`,
        user_id: userData.id,
        can_proceed: true
      })

    } catch (error: any) {
      console.error('💥 EMAIL CHECK - Exception:', error)
      setEmailValidation({
        checking: false,
        status: 'error',
        message: 'Unable to validate email',
        can_proceed: false
      })
    }
  }, [user?.id])

  // Debounced email check
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailExists(formData.email)
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [formData.email, checkEmailExists])

  // Form input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user types
  }

  // File upload handler
  const handleFileChange = (documentType: DocumentFile['type'], file: File | null) => {
    console.log('📁 ADD BORROWER - File selected:', documentType, file?.name)
    
    setDocuments(prev => prev.map(doc => {
      if (doc.type === documentType) {
        const preview = file && file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined
          
        return { ...doc, file, preview }
      }
      return doc
    }))
  }

  // 🆕 ENHANCED: Updated validation for multi-tenant
  const validateStep1 = () => {
    if (!formData.full_name.trim()) return 'Full name is required'
    if (!formData.email.trim()) return 'Email is required'
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) return 'Valid email format required'
    
    // Check validation status
    if (emailValidation.checking) return 'Please wait while we validate email...'
    if (!emailValidation.can_proceed) {
      if (emailValidation.status === 'existing_assigned') {
        return 'This person is already your borrower. Go to Create Loan instead.'
      }
      return emailValidation.message
    }
    
    // Phone validation only if provided
    if (formData.phone.trim()) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        return 'Valid 10-digit phone number required (if provided)'
      }
    }
    
    return null
  }

  const validateStep2 = () => {
    // All fields optional in step 2
    if (formData.monthly_income.trim()) {
      const income = parseFloat(formData.monthly_income)
      if (isNaN(income) || income <= 0) return 'Valid monthly income required (if provided)'
    }
    
    return null
  }

  // Step navigation
  const handleNextStep = () => {
    let validationError = null
    
    if (currentStep === 1) validationError = validateStep1()
    if (currentStep === 2) validationError = validateStep2()
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError('')
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setCurrentStep(prev => prev - 1)
  }

  // File upload to Supabase Storage
  const uploadDocument = async (file: File, borrowerId: string, documentType: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${borrowerId}/${documentType}.${fileExt}`
      
      console.log('📤 ADD BORROWER - Uploading file:', fileName)
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      console.log('✅ ADD BORROWER - File uploaded:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ ADD BORROWER - Upload error:', error)
      throw error
    }
  }

  // 🆕 ENHANCED: Helper for existing user scenario
  const handleExistingUserScenario = async (borrowerUserId: string) => {
    console.log('📝 SCENARIO B - Adding existing user as borrower')
    
    // Update user roles to include borrower (if needed)
    const { error: roleUpdateError } = await supabase
      .from('users')
      .update({
        roles: ['borrower'] // Ensure borrower role exists
      })
      .eq('id', borrowerUserId)
      .is('roles', null)

    if (roleUpdateError) {
      console.warn('⚠️ Role update warning:', roleUpdateError)
    }

    // Update profile with any new info provided
    if (formData.address.trim()) {
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: borrowerUserId,
          address: formData.address,
          kyc_status: 'pending'
        })

      if (profileUpdateError) {
        console.warn('⚠️ Profile update warning:', profileUpdateError)
      }
    }
  }

  // 🆕 ENHANCED: Multi-tenant form submission
  const handleSubmit = async () => {
    console.log('🚀 ENHANCED SUBMIT - Starting with status:', emailValidation.status)
    
    // Final validation
    const step1Error = validateStep1()
    if (step1Error) {
      setError(step1Error)
      return
    }
    
    if (!user) {
      setError('You must be logged in as a lender')
      return
    }

    if (!emailValidation.can_proceed) {
      setError('Please resolve email validation issues first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let borrowerUserId = emailValidation.user_id

      // SCENARIO A: New user - create everything (existing logic)
      if (emailValidation.status === 'new') {
        console.log('📝 SCENARIO A - Creating new user and borrower')
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.toLowerCase().trim(),
          password: 'TempPassword123!', // Will be changed on first login
          options: {
            data: {
              full_name: formData.full_name,
              role: 'borrower'
            }
          }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Failed to create user account')
        borrowerUserId = authData.user.id

        console.log('✅ ADD BORROWER - Auth user created:', borrowerUserId)

        // Step 2: Insert into users table
        console.log('📝 ADD BORROWER - Creating user record...')
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: borrowerUserId,
            email: formData.email.toLowerCase().trim(),
            role: 'borrower',
            roles: ['borrower'], // 🆕 Multi-role support
            phone: formData.phone || '',
            full_name: formData.full_name,
            active: true,
            email_verified: false,
            pending_approval: false
          })

        if (userError) throw userError
        console.log('✅ ADD BORROWER - User record created')

        // Step 3: Create user profile (optional fields)
        console.log('📝 ADD BORROWER - Creating user profile...')
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: borrowerUserId,
            address: formData.address || null,
            kyc_status: 'pending'
          })

        if (profileError) {
          console.warn('⚠️ ADD BORROWER - Profile creation failed:', profileError)
          // Don't fail for profile errors
        } else {
          console.log('✅ ADD BORROWER - User profile created')
        }
      }
      
      // SCENARIO B: Existing user - add borrower relationship only
      else if (emailValidation.status === 'existing_available') {
        await handleExistingUserScenario(borrowerUserId!)
      }

      // COMMON: Create borrower relationship (both scenarios)
      console.log('📝 COMMON - Creating borrower relationship')
      const { error: borrowerError } = await supabase
        .from('borrowers')
        .insert({
          user_id: borrowerUserId,
          lender_id: user.id,
          credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
          employment_type: formData.employment_type || null,
          monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null
        })

      if (borrowerError) throw borrowerError
      console.log('✅ COMMON - Borrower relationship created')

      // COMMON: Upload documents (existing logic)
      console.log('📝 COMMON - Uploading documents...')
      const uploadPromises = documents
        .filter(doc => doc.file)
        .map(async (doc) => {
          try {
            const fileUrl = await uploadDocument(doc.file!, borrowerUserId!, doc.type)
            
            return supabase
              .from('documents')
              .insert({
                borrower_id: borrowerUserId,
                document_type: doc.type,
                file_url: fileUrl,
                verification_status: 'pending'
              })
          } catch (error) {
            console.error(`❌ ADD BORROWER - Failed to upload ${doc.type}:`, error)
            return null
          }
        })

      await Promise.all(uploadPromises)
      console.log('✅ ADD BORROWER - Documents processed')

      // Success message based on scenario
      const successMessage = emailValidation.status === 'new' 
        ? 'New borrower created successfully!' 
        : 'Existing user added as your borrower!'

      console.log(`🎉 ${successMessage}`)
      setSuccess(successMessage)
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        employment_type: 'salaried',
        monthly_income: '',
        credit_score: '650'
      })
      setEmailValidation({
        checking: false,
        status: 'new',
        message: '',
        can_proceed: true
      })
      setCurrentStep(1)
      setDocuments([
        { type: 'aadhar', file: null },
        { type: 'pan', file: null },
        { type: 'photo', file: null },
        { type: 'salary_slip', file: null }
      ])

      // Call success callback
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000)
      }

    } catch (error: unknown) {
      console.error('💥 ENHANCED SUBMIT - Submission failed:', error)
      setError((error as Error).message || 'Failed to add borrower. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Render document upload section
  const renderDocumentUpload = (doc: DocumentFile) => {
    const docLabels = {
      aadhar: 'Aadhar Card',
      pan: 'PAN Card', 
      salary_slip: 'Salary Slip',
      bank_statement: 'Bank Statement',
      photo: 'Passport Photo'
    }

    return (
      <div key={doc.type} className="border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            {docLabels[doc.type]} <span className="text-gray-400">(Optional)</span>
          </label>
          {doc.file && (
            <button
              type="button"
              onClick={() => handleFileChange(doc.type, null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!doc.file ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Click to upload {docLabels[doc.type]}</p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">{doc.file.name}</span>
            </div>
            <span className="text-xs text-green-600">
              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-6 w-6 mr-3" />
            <h2 className="text-xl font-bold">Add New Borrower</h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        
        {/* Progress Steps */}
        <div className="mt-4 flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-400 text-white'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-white' : 'bg-blue-400'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter borrower's full name"
                  required
                />
              </div>
            </div>

            {/* 🆕 ENHANCED: Email with multi-tenant validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    emailValidation.status === 'error' ? 'border-red-300' : 
                    emailValidation.status === 'existing_assigned' ? 'border-orange-300' :
                    emailValidation.status === 'existing_available' ? 'border-blue-300' :
                    emailValidation.can_proceed && formData.email ? 'border-green-300' : 
                    'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailValidation.checking && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  )}
                  {!emailValidation.checking && formData.email && (
                    emailValidation.status === 'error' || emailValidation.status === 'existing_assigned' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : emailValidation.can_proceed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : null
                  )}
                </div>
              </div>
              {/* 🆕 ENHANCED: Multi-status email feedback */}
              {emailValidation.message && (
                <p className={`mt-1 text-sm ${
                  emailValidation.status === 'error' ? 'text-red-600' :
                  emailValidation.status === 'existing_assigned' ? 'text-orange-600' :
                  emailValidation.status === 'existing_available' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {emailValidation.message}
                </p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 10-digit phone number"
                />
              </div>
            </div>

            {/* Address (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Employment Information (All Optional) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment & Income (Optional)</h3>
            
            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="daily_wage">Daily Wage</option>
                  <option value="farmer">Farmer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income (₹)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter monthly income"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Credit Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Credit Score
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="credit_score"
                  value={formData.credit_score}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="300">Poor (300-579)</option>
                  <option value="580">Fair (580-669)</option>
                  <option value="650">Good (670-739)</option>
                  <option value="740">Very Good (740-799)</option>
                  <option value="800">Excellent (800-850)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload (All Optional) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">KYC Documents (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload documents for KYC verification. All documents are optional and can be added later.
            </p>
            
            <div className="space-y-4">
              {documents.map(doc => renderDocumentUpload(doc))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading || emailValidation.checking || !emailValidation.can_proceed}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || emailValidation.checking || !emailValidation.can_proceed}
                loading={isLoading}
                className="px-8 py-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Adding Borrower...' : 'Add Borrower'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}