// types/database.ts - Supabase Generated Types
export interface Database {
    public: {
      Tables: {
        users: {
          Row: {
            id: string
            email: string
            role: 'super_admin' | 'lender' | 'borrower'
            phone: string
            full_name: string
            active: boolean
            email_verified: boolean
            pending_approval: boolean
            created_at: string
            updated_at: string
            deleted_at: string | null
          }
          Insert: {
            id?: string
            email: string
            role?: 'super_admin' | 'lender' | 'borrower'
            phone: string
            full_name: string
            active?: boolean
            email_verified?: boolean
            pending_approval?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
          }
          Update: {
            id?: string
            email?: string
            role?: 'super_admin' | 'lender' | 'borrower'
            phone?: string
            full_name?: string
            active?: boolean
            email_verified?: boolean
            pending_approval?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
          }
        }
        // Add other table types as needed
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        [_ in never]: never
      }
      Enums: {
        [_ in never]: never
      }
    }
  }