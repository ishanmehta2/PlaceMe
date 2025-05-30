import { DEFAULTS } from './constants';

export const positionUtils = {
  calculateTokenPosition: (x: number, y: number, size: number) => ({
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
    marginLeft: `-${size/2}px`,
    marginTop: `-${size/2}px`,
  }),

  pixelPositionToPercentage: (pixelX: number, pixelY: number) => ({
    x: (pixelX - DEFAULTS.TOKEN_SIZE) / (DEFAULTS.AXIS_WIDTH - DEFAULTS.TOKEN_SIZE),
    y: (pixelY - DEFAULTS.TOKEN_SIZE/2) / (DEFAULTS.AXIS_HEIGHT - DEFAULTS.TOKEN_SIZE)
  }),

  percentageToPixelPosition: (percentageX: number, percentageY: number) => ({
    x: percentageX * DEFAULTS.AXIS_WIDTH,
    y: percentageY * (DEFAULTS.AXIS_HEIGHT + DEFAULTS.NEUTRAL_ZONE_HEIGHT)
  }),
  
  calculateTokenSize: (baseSize: number) => ({
    border: Math.max(4, Math.round(baseSize * 0.13)),
    fontSize: Math.max(14, Math.round(baseSize * 0.36)),
    imageSize: baseSize - (Math.max(4, Math.round(baseSize * 0.13)) * 2),
  }),

  clampToGrid: (x: number, y: number, gridWidth: number, gridHeight: number, tokenSize: number, neutralZoneHeight: number = 0) => ({
    x: Math.max(tokenSize, Math.min(x, gridWidth)),
    y: Math.max(tokenSize/2, Math.min(y, gridHeight + neutralZoneHeight - tokenSize/2))
  })
} 