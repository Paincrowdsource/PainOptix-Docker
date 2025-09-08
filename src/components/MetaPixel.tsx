'use client';

import Script from 'next/script';

export default function MetaPixel() {
  // TEMPORARY HARDCODE - Environment variables not working in DigitalOcean build
  // TODO: Fix environment variable issue and revert this
  const pixelId = '1623899711325019';
  const enabled = true;
  
  // Original code for reference (not working due to env var issue):
  // const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  // const enabled = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === 'true';
  
  if (!pixelId || !enabled) {
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        onLoad={() => console.log('[MetaPixel] Facebook Pixel loaded with ID:', pixelId)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
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