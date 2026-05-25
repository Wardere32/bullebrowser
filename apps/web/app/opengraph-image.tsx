import { ImageResponse } from 'next/og';
import { product } from '@bullebrowser/brand-tokens';

export const dynamic = 'force-static';
export const alt = product.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: '80px',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '54px',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            B
          </div>
          <div style={{ fontSize: '64px', fontWeight: 800, letterSpacing: -2 }}>
            {product.name}
          </div>
        </div>
        <div style={{ fontSize: '40px', fontWeight: 600, lineHeight: 1.15, maxWidth: 980 }}>
          {product.tagline}
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: '24px',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#F59E0B',
            }}
          />
          By {product.vendor}
        </div>
      </div>
    ),
    size,
  );
}
