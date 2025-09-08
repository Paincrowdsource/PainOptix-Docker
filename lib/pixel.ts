/**
 * Meta Pixel Tracking Utility
 * Handles Meta (Facebook) Pixel initialization and event tracking
 * SPA-aware with route change tracking for Next.js App Router
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface PixelConfig {
  pixelId?: string;
  enabled?: boolean;
  testEventCode?: string;
}

class MetaPixel {
  private initialized = false;
  private config: PixelConfig = {};
  private currentPath = '';

  constructor() {
    // Load config from environment variables
    this.config = {
      pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
      enabled: process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === 'true',
      testEventCode: process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE,
    };
  }

  /**
   * Initialize Meta Pixel
   * Injects the base code and fires initial PageView
   */
  public init(): void {
    // Exit if already initialized or not enabled
    if (this.initialized || !this.config.enabled || !this.config.pixelId) {
      if (!this.config.enabled) {
        console.log('[MetaPixel] Tracking disabled via META_PIXEL_ENABLED');
      }
      if (!this.config.pixelId) {
        console.log('[MetaPixel] No NEXT_PUBLIC_META_PIXEL_ID configured');
      }
      return;
    }

    try {
      // Inject Meta Pixel base code
      this.injectPixelCode();
      
      // Initialize pixel with optional test event code
      const initParams: any = {};
      if (this.config.testEventCode) {
        initParams.test_event_code = this.config.testEventCode;
        console.log('[MetaPixel] Test mode enabled with code:', this.config.testEventCode);
      }
      
      window.fbq('init', this.config.pixelId, {}, initParams);
      
      // Track initial page view
      this.trackPageView();
      
      this.initialized = true;
      console.log('[MetaPixel] Initialized with ID:', this.config.pixelId);
    } catch (error) {
      console.error('[MetaPixel] Initialization error:', error);
    }
  }

  /**
   * Inject Meta Pixel base code into the page
   */
  private injectPixelCode(): void {
    if (window.fbq) return;

    const n = window.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    // Create and inject script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }

  /**
   * Track a PageView event
   * @param path Optional path to track (defaults to current URL)
   */
  public trackPageView(path?: string): void {
    if (!this.initialized || !this.config.enabled) return;

    try {
      // Prevent duplicate tracking for same path (handles hash changes)
      const trackPath = path || window.location.pathname + window.location.search;
      if (trackPath === this.currentPath) {
        console.log('[MetaPixel] Skipping duplicate PageView for:', trackPath);
        return;
      }
      
      this.currentPath = trackPath;
      window.fbq('track', 'PageView');
      console.log('[MetaPixel] PageView tracked for:', trackPath);
    } catch (error) {
      console.error('[MetaPixel] PageView tracking error:', error);
    }
  }

  /**
   * Track a custom event
   * @param eventName The event name (e.g., 'Purchase', 'Lead', 'CompleteRegistration')
   * @param parameters Optional event parameters (no PII allowed)
   */
  public track(eventName: string, parameters?: Record<string, any>): void {
    if (!this.initialized || !this.config.enabled) return;

    try {
      // Validate no PII in parameters
      if (parameters) {
        this.validateParameters(parameters);
      }

      if (parameters) {
        window.fbq('track', eventName, parameters);
      } else {
        window.fbq('track', eventName);
      }
      
      console.log('[MetaPixel] Event tracked:', eventName, parameters || '');
    } catch (error) {
      console.error('[MetaPixel] Event tracking error:', error);
    }
  }

  /**
   * Track a custom event (non-standard events)
   * @param eventName The custom event name
   * @param parameters Optional event parameters (no PII allowed)
   */
  public trackCustom(eventName: string, parameters?: Record<string, any>): void {
    if (!this.initialized || !this.config.enabled) return;

    try {
      // Validate no PII in parameters
      if (parameters) {
        this.validateParameters(parameters);
      }

      if (parameters) {
        window.fbq('trackCustom', eventName, parameters);
      } else {
        window.fbq('trackCustom', eventName);
      }
      
      console.log('[MetaPixel] Custom event tracked:', eventName, parameters || '');
    } catch (error) {
      console.error('[MetaPixel] Custom event tracking error:', error);
    }
  }

  /**
   * Validate parameters to ensure no PII
   * @param parameters Event parameters to validate
   */
  private validateParameters(parameters: Record<string, any>): void {
    const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'dob', 'ip'];
    const keys = Object.keys(parameters).map(k => k.toLowerCase());
    
    for (const field of piiFields) {
      if (keys.some(key => key.includes(field))) {
        throw new Error(`Potential PII field detected: ${field}. Remove before tracking.`);
      }
    }
  }

  /**
   * Handle route changes for SPA tracking
   * @param url The new URL
   */
  public handleRouteChange(url: string): void {
    if (!this.initialized || !this.config.enabled) return;
    
    // Extract path from URL
    const path = new URL(url, window.location.origin).pathname;
    this.trackPageView(path);
  }

  /**
   * Check if pixel is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled || false;
  }

  /**
   * Check if pixel is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Create singleton instance
const pixel = new MetaPixel();

// Export functions for easy use
export const initPixel = () => pixel.init();
export const trackPageView = (path?: string) => pixel.trackPageView(path);
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => pixel.track(eventName, parameters);
export const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => pixel.trackCustom(eventName, parameters);
export const handleRouteChange = (url: string) => pixel.handleRouteChange(url);
export const isPixelEnabled = () => pixel.isEnabled();
export const isPixelInitialized = () => pixel.isInitialized();

// Export the instance for advanced use cases
export default pixel;