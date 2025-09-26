export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  GAME: '/game',
  PROFILE: '/profile',
  TOURNAMENT: '/tournament',  
} as const;

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 80,
  BALL_SIZE: 10,
  PADDLE_SPEED: 5,
  BALL_SPEED: 3
} as const;

export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:3001/api',
  AUTH: '/auth',
  USERS: '/users',
  GAMES: '/games'
} as const;