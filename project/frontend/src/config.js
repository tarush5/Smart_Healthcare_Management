/**
 * Centralized configuration for API endpoints.
 * Values are read from environment variables (set in .env).
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
export const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000'
