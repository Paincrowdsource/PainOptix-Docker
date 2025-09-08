'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const testEventCode = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE;
  const isEnabled = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === 'true';
  
  // Debug logging
  useEffect(() => {
    console.log('[MetaPixel] Configuration:', {
      pixelId,
      isEnabled,
      testEventCode,
      env: {
        NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
        NEXT_PUBLIC_META_PIXEL_ENABLED: process.env.NEXT_PUBLIC_META_PIXEL_ENABLED,
      }
    });
  }, []);
  
  if (!pixelId || !isEnabled) {
    console.log('[MetaPixel] Not rendering - pixelId:', pixelId, 'enabled:', isEnabled);
    return null;
  }

  // Build initialization code with optional test event
  const initCode = testEventCode 
    ? `fbq('init', '${pixelId}', {}, {test_event_code: '${testEventCode}'})`
    : `fbq('init', '${pixelId}')`;

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        onLoad={() => console.log('[MetaPixel] Facebook Pixel script loaded')}
        dangerouslySetInnerHTML={{
          __html: `
            console.log('[MetaPixel] Initializing with ID:', '${pixelId}');
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            ${initCode};
            fbq('track', 'PageView');
            console.log('[MetaPixel] PageView tracked');
          `,
        }}
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}