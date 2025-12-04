import { z, ZodError } from 'zod'

// Assessment submission validation
export const assessmentSubmissionSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1)
  })).min(1).max(50), // Prevent excessive data
  name: z.string().max(100).optional().nullable(),
  contactMethod: z.enum(['email', 'sms']),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string()
    .regex(/^\+?1?\d{10,15}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  initialPainScore: z.number().int().min(0).max(10),
  referrerSource: z.string().max(50).optional(),
  // Phase 1 Pivot: SMS-first data collection fields
  smsOptIn: z.boolean().optional().default(false),
  deliveryMethod: z.enum(['sms', 'email', 'both']).optional().default('sms')
}).refine(
  (data) => {
    // Ensure email is provided if contactMethod is email
    if (data.contactMethod === 'email' && !data.email) {
      return false
    }
    // Ensure phone is provided if contactMethod is sms
    if (data.contactMethod === 'sms' && !data.phoneNumber) {
      return false
    }
    return true
  },
  {
    message: "Contact information required for selected method"
  }
)

// Assessment update validation
export const assessmentUpdateSchema = z.object({
  id: z.string().uuid(),
  guide_opened_at: z.string().datetime().optional(),
  payment_tier: z.enum(['free', 'enhanced', 'comprehensive']).optional(),
  payment_completed: z.boolean().optional(),
  stripe_session_id: z.string().optional()
})

// Delete request validation
export const deleteRequestSchema = z.object({
  identifier: z.string().min(1).max(255).refine(
    (val) => {
      // Must be either email or phone format
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      const isPhone = /^\+?1?\d{10,15}$/.test(val)
      return isEmail || isPhone
    },
    {
      message: "Must be a valid email or phone number"
    }
  )
})

// Delete confirmation validation
export const deleteConfirmSchema = z.object({
  identifier: z.string().min(1).max(255),
  verificationCode: z.string().length(6).regex(/^\d{6}$/, 'Must be 6 digits')
})

// Checkout creation validation
export const createCheckoutSchema = z.object({
  assessmentId: z.string().uuid(),
  priceId: z.enum(['enhanced', 'monograph']),
  tierPrice: z.number().int().positive()
})

// Sanitize error messages to avoid exposing internals
export function sanitizeError(error: unknown): string {
  if (error instanceof ZodError) {
    // Return first validation error in a user-friendly way
    const issues = error.format()
    const firstError = error.issues[0]
    return `Invalid ${firstError.path.join('.')}: ${firstError.message}`
  }
  
  // Generic error message for production
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred processing your request'
  }
  
  // More detailed error in development
  return error instanceof Error ? error.message : 'Unknown error'
}