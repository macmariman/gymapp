import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64
};

export const contentType = 'image/png';

export default function Icon() {
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
            borderRadius: 18,
            display: 'flex',
            height: 40,
            justifyContent: 'center',
            width: 40
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 2,
              transform: 'rotate(-18deg)'
            }}
          >
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 14,
                width: 4
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 18,
                width: 4
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 4,
                width: 12
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 18,
                width: 4
              }}
            />
            <div
              style={{
                background: '#0f172a',
                borderRadius: 999,
                height: 14,
                width: 4
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
