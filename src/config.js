export const LAYER_NON_MOVING = 0
export const LAYER_MOVING = 1
export const NUM_OBJECT_LAYERS = 2

export const BALL_COUNT = 20
export const SPAWN_INTERVAL = 0.15
export const BALL_RADIUS_MIN = 0.3
export const BALL_RADIUS_MAX = 0.8
export const SPAWN_HEIGHT = 12
export const SPAWN_RADIUS = 8
export const TIME_STEP = 1 / 60

export const COLORS = [
  0xff4444, 0xff8800, 0xffcc00, 0x44cc44, 0x4488ff,
  0x8844ff, 0xff44cc, 0x00cccc, 0xcc8844, 0x66aaff,
  0xff6688, 0x88ff44, 0xaa44ff, 0xffaa44, 0x44ffaa,
  0xff4466, 0x6688ff, 0xcc66ff, 0x66ffcc, 0xffcc66,
]

export const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768
export const MAX_PIXEL_RATIO = isMobile ? 1.5 : 2
export const SHADOW_SIZE = isMobile ? 1024 : 2048
export const SPHERE_SEGMENTS = isMobile ? 16 : 24
