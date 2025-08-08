import { POST, PATCH } from './route';
import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { deliverEducationalGuide } from '@/lib/guide-delivery';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/supabase-admin');
jest.mock('@/lib/guide-delivery');
jest.mock('@/lib/logger');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn()
};

(getServiceSupabase as jest.Mock).mockReturnValue(mockSupabase);

describe('/api/assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Create Assessment', () => {
    test('should create assessment with valid email contact', async () => {
      const mockAssessment = {
        id: 'test-assessment-id',
        session_id: 'test-session-id',
        email: 'test@example.com',
        guide_type: 'sciatica'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAssessment,
        error: null
      });
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-id' },
        error: null
      });

      (deliverEducationalGuide as jest.Mock).mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [
            { questionId: 'Q1', question: 'Where is pain?', answer: 'back_one_leg' },
            { questionId: 'Q4', question: 'Below knee?', answer: 'yes' }
          ],
          name: 'Test User',
          contactMethod: 'email',
          email: 'test@example.com',
          initialPainScore: 7,
          referrerSource: 'google'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.assessmentId).toBe('test-assessment-id');
      expect(data.guideType).toBe('sciatica');
      expect(data.message).toContain('email');

      // Verify database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('assessments');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          contact_consent: true,
          guide_type: 'sciatica',
          payment_tier: 'free'
        })
      );

      // Verify guide delivery was triggered
      expect(deliverEducationalGuide).toHaveBeenCalledWith('test-assessment-id');
    });

    test('should create assessment with SMS contact', async () => {
      const mockAssessment = {
        id: 'test-assessment-id',
        phone_number: '+12125551234',
        guide_type: 'muscular_nslbp'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAssessment,
        error: null
      });
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-id' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [
            { questionId: 'Q1', question: 'Where?', answer: 'back_only' }
          ],
          contactMethod: 'sms',
          phoneNumber: '+12125551234',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('sms');
    });

    test('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email',
          email: 'invalid-email',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    test('should reject invalid phone format', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'sms',
          phoneNumber: '123',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    test('should require responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [],
          contactMethod: 'email',
          email: 'test@example.com',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database connection failed')
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          contactMethod: 'email',
          email: 'test@example.com',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).not.toContain('Database connection'); // Should be sanitized
    });

    test('should detect urgent symptoms', async () => {
      const mockAssessment = {
        id: 'urgent-assessment-id',
        guide_type: 'urgent_symptoms'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAssessment,
        error: null
      });
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-id' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [
            { questionId: 'Q1', question: 'Where?', answer: 'back_only' },
            { questionId: 'Q13', question: 'Bladder control?', answer: 'yes' } // Red flag
          ],
          contactMethod: 'email',
          email: 'urgent@example.com',
          initialPainScore: 9
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.guideType).toBe('urgent_symptoms');
    });
  });

  describe('PATCH - Update Assessment', () => {
    test('should update assessment with valid data', async () => {
      const mockUpdatedAssessment = {
        id: 'test-id',
        guide_opened_at: '2024-01-01T12:00:00Z',
        payment_tier: 'enhanced'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedAssessment,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'test-id',
          guide_opened_at: '2024-01-01T12:00:00Z',
          payment_tier: 'enhanced'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUpdatedAssessment);
    });

    test('should require assessment ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'PATCH',
        body: JSON.stringify({
          payment_tier: 'enhanced'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Assessment ID required');
    });

    test('should validate UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'not-a-uuid',
          payment_tier: 'enhanced'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    test('should validate payment tier enum', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'PATCH',
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          payment_tier: 'premium' // Invalid tier
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });
  });

  describe('Security', () => {
    test('should sanitize SQL injection attempts', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-id' },
        error: null
      });
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-id' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [
            { 
              questionId: 'Q1', 
              question: 'Test', 
              answer: "'; DROP TABLE assessments; --" 
            }
          ],
          name: "Robert'); DROP TABLE users; --",
          contactMethod: 'email',
          email: 'test@example.com',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still create assessment - SQL injection is prevented at DB level
      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Robert'); DROP TABLE users; --", // Stored as-is, parameterized by DB
          responses: expect.arrayContaining([
            expect.objectContaining({
              answer: "'; DROP TABLE assessments; --"
            })
          ])
        })
      );
    });

    test('should handle XSS attempts', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-id' },
        error: null
      });
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-id' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          responses: [{ questionId: 'Q1', question: 'Q', answer: 'A' }],
          name: '<script>alert("XSS")</script>',
          contactMethod: 'email',
          email: 'test@example.com',
          initialPainScore: 5
        })
      });

      const response = await POST(request);
      
      // Should succeed - XSS prevention happens on output
      expect(response.status).toBe(200);
    });
  });
});