import { CSSProperties } from 'react'

export const tokenStyles: {
  base: CSSProperties
  container: CSSProperties
  image: CSSProperties
  name: CSSProperties
} = {
  base: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbe6',
    borderRadius: '50%',
    overflow: 'hidden',
  },
  image: {
    objectFit: 'cover' as const,
    borderRadius: '50%',
  },
  name: {
    marginTop: '4px',
    textAlign: 'center' as const,
    color: '#222',
    textShadow: '0 1px 2px #fff',
    transition: 'all 0.3s ease-in-out',
  }
} 