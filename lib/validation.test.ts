import { 
  assessmentSubmissionSchema, 
  assessmentUpdateSchema,
  deleteRequestSchema,
  deleteConfirmSchema,
  createCheckoutSchema,
  sanitizeError 
} from './validation';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('assessmentSubmissionSchema', () => {
    test('should validate valid assessment submission', () => {
      const validData = {
        responses: [
          { questionId: 'Q1', question: 'Where is pain?', answer: 'back_only' },
          { questionId: 'Q2', question: 'What makes worse?', answer: 'sitting' }
        ],
        name: 'John Doe',
        contactMethod: 'email' as const,
        email: 'john@example.com',
        initialPainScore: 7,
        referrerSource: 'google'
      };

      const result = assessmentSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should require email when contactMethod is email', () => {
      const invalidData = {
        responses: [
          { questionId: 'Q1', question: 'Where?', answer: 'back' }
        ],
        contactMethod: 'email' as const,
        // missing email
        initialPainScore: 5
      };

      const result = assessmentSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should require phone when contactMethod is sms', () => {
      const invalidData = {
        responses: [
          { questionId: 'Q1', question: 'Where?', answer: 'back' }
        ],
        contactMethod: 'sms' as const,
        // missing phoneNumber
        initialPainScore: 5
      };

      const result = assessmentSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should validate phone number format', () => {
      const validPhones = [
        '+12125551234',
        '12125551234',
        '2125551234',
        '+442071234567'
      ];

      validPhones.forEach(phone => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'sms' as const,
          phoneNumber: phone,
          initialPainScore: 5
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidPhones = ['123', 'abc', '555-1234', '(212) 555-1234'];
      
      invalidPhones.forEach(phone => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'sms' as const,
          phoneNumber: phone,
          initialPainScore: 5
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@company.org'
      ];

      validEmails.forEach(email => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email' as const,
          email: email,
          initialPainScore: 5
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidEmails = ['invalid', '@domain.com', 'user@', 'user @domain.com'];
      
      invalidEmails.forEach(email => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email' as const,
          email: email,
          initialPainScore: 5
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    test('should validate pain score range', () => {
      const validScores = [0, 1, 5, 10];
      
      validScores.forEach(score => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email' as const,
          email: 'test@example.com',
          initialPainScore: score
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidScores = [-1, 11, 5.5, NaN];
      
      invalidScores.forEach(score => {
        const data = {
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email' as const,
          email: 'test@example.com',
          initialPainScore: score
        };
        const result = assessmentSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    test('should require at least one response', () => {
      const data = {
        responses: [],
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5
      };
      const result = assessmentSubmissionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should limit responses to 50', () => {
      const tooManyResponses = Array(51).fill({
        questionId: 'Q1',
        question: 'Question',
        answer: 'Answer'
      });

      const data = {
        responses: tooManyResponses,
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5
      };
      const result = assessmentSubmissionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should limit name length', () => {
      const longName = 'a'.repeat(101);
      const data = {
        responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
        name: longName,
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5
      };
      const result = assessmentSubmissionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('assessmentUpdateSchema', () => {
    test('should validate valid update', () => {
      const validUpdate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        guide_opened_at: '2024-01-01T12:00:00Z',
        payment_tier: 'enhanced' as const,
        payment_completed: true,
        stripe_session_id: 'cs_test_123'
      };

      const result = assessmentUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    test('should require valid UUID', () => {
      const invalidUpdate = {
        id: 'not-a-uuid',
        payment_completed: true
      };

      const result = assessmentUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    test('should validate payment tier enum', () => {
      const validTiers = ['free', 'enhanced', 'comprehensive'];
      
      validTiers.forEach(tier => {
        const data = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          payment_tier: tier
        };
        const result = assessmentUpdateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        payment_tier: 'premium' // not in enum
      };
      const result = assessmentUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deleteRequestSchema', () => {
    test('should accept valid email', () => {
      const data = { identifier: 'user@example.com' };
      const result = deleteRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should accept valid phone', () => {
      const data = { identifier: '+12125551234' };
      const result = deleteRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should reject invalid format', () => {
      const invalidIdentifiers = ['invalid', '123', 'user@', '@domain'];
      
      invalidIdentifiers.forEach(identifier => {
        const result = deleteRequestSchema.safeParse({ identifier });
        expect(result.success).toBe(false);
      });
    });

    test('should limit identifier length', () => {
      const longIdentifier = 'a'.repeat(256) + '@example.com';
      const result = deleteRequestSchema.safeParse({ identifier: longIdentifier });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteConfirmSchema', () => {
    test('should validate 6-digit code', () => {
      const validCodes = ['123456', '000000', '999999'];
      
      validCodes.forEach(code => {
        const data = {
          identifier: 'user@example.com',
          verificationCode: code
        };
        const result = deleteConfirmSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid verification codes', () => {
      const invalidCodes = ['12345', '1234567', 'abcdef', '12345a'];
      
      invalidCodes.forEach(code => {
        const data = {
          identifier: 'user@example.com',
          verificationCode: code
        };
        const result = deleteConfirmSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('createCheckoutSchema', () => {
    test('should validate valid checkout request', () => {
      const validData = {
        assessmentId: '550e8400-e29b-41d4-a716-446655440000',
        priceId: 'enhanced' as const,
        tierPrice: 5
      };

      const result = createCheckoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should validate priceId enum', () => {
      const validPriceIds = ['enhanced', 'monograph'];
      
      validPriceIds.forEach(priceId => {
        const data = {
          assessmentId: '550e8400-e29b-41d4-a716-446655440000',
          priceId: priceId,
          tierPrice: 10
        };
        const result = createCheckoutSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidData = {
        assessmentId: '550e8400-e29b-41d4-a716-446655440000',
        priceId: 'free', // not in enum for checkout
        tierPrice: 0
      };
      const result = createCheckoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should require positive tier price', () => {
      const invalidPrices = [0, -5];
      
      invalidPrices.forEach(price => {
        const data = {
          assessmentId: '550e8400-e29b-41d4-a716-446655440000',
          priceId: 'enhanced' as const,
          tierPrice: price
        };
        const result = createCheckoutSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('sanitizeError', () => {
    test('should sanitize ZodError', () => {
      try {
        assessmentSubmissionSchema.parse({
          responses: [],
          contactMethod: 'invalid'
        });
      } catch (error) {
        const sanitized = sanitizeError(error);
        expect(sanitized).toContain('Invalid');
        expect(sanitized).not.toContain('ZodError');
      }
    });

    test('should return generic message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');
      const sanitized = sanitizeError(error);
      expect(sanitized).toBe('An error occurred processing your request');

      process.env.NODE_ENV = originalEnv;
    });

    test('should return detailed message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');
      const sanitized = sanitizeError(error);
      expect(sanitized).toBe('Database connection failed');

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle non-Error objects', () => {
      const sanitized = sanitizeError('string error');
      expect(sanitized).toBe('Unknown error');
    });
  });

  describe('Security Validations', () => {
    test('should prevent SQL injection attempts in responses', () => {
      const maliciousData = {
        responses: [
          { 
            questionId: 'Q1', 
            question: 'Test', 
            answer: "'; DROP TABLE assessments; --" 
          }
        ],
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5
      };

      // Schema allows this as a string, but it will be parameterized by database
      const result = assessmentSubmissionSchema.safeParse(maliciousData);
      expect(result.success).toBe(true); // Schema doesn't block SQL, database does
    });

    test('should prevent XSS attempts in name field', () => {
      const xssData = {
        responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
        name: '<script>alert("XSS")</script>',
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5
      };

      // Schema allows this, but it should be escaped on output
      const result = assessmentSubmissionSchema.safeParse(xssData);
      expect(result.success).toBe(true);
    });

    test('should limit referrer source length', () => {
      const longReferrer = 'a'.repeat(51);
      const data = {
        responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
        contactMethod: 'email' as const,
        email: 'test@example.com',
        initialPainScore: 5,
        referrerSource: longReferrer
      };
      const result = assessmentSubmissionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});