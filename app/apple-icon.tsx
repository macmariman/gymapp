import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#10b981',
            borderRadius: 48,
            display: 'flex',
            height: 120,
            justifyContent: 'center',
            width: 120
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 6,
              transform: 'rotate(-18deg)'
            }}
          >
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 42,
                width: 12
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 54,
                width: 12
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 10,
                width: 34
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 54,
                width: 12
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 42,
                width: 12
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
