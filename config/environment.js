// Configuration centralisée des URLs et variables d'environnement
// Ce fichier centralise toutes les URLs pour éviter les URLs codées en dur

require('dotenv').config();

// Configuration de l'API
const API_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || 'localhost',
  BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  API_PATH: '/api',
  WS_PATH: '/socket.io',
};

// Configuration des URLs frontend
const FRONTEND_CONFIG = {
  URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:8080',
  CORS_ORIGINS: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:8080', 
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000'
      ],
};

// Configuration des URLs d'images
const IMAGE_CONFIG = {
  // URL de base pour les images
  BASE_URL: process.env.IMAGE_BASE_URL || API_CONFIG.BASE_URL,
  
  // Fonction utilitaire pour construire l'URL complète d'une image
  getImageUrl: (imagePath) => {
    if (!imagePath) return '';
    
    // Si l'image est déjà une URL complète (http/https), la retourner telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Sinon, construire l'URL complète
    const baseUrl = IMAGE_CONFIG.BASE_URL;
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  },
  
  // Fonction pour vérifier si une URL est valide
  isValidImageUrl: (url) => {
    return !!(url && (url.startsWith('http://') || url.startsWith('https://')));
  }
};

// Configuration Socket.IO
const SOCKET_CONFIG = {
  CORS: {
    origin: FRONTEND_CONFIG.CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  OPTIONS: {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    maxReconnectionDelay: 10000,
    reconnectionDelayGrowthFactor: 1.5
  }
};

// Configuration des URLs de redirection
const REDIRECT_CONFIG = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SUPPLIER_DASHBOARD: '/supplier/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  HOME: '/',
  EMAIL_VERIFICATION: '/verify-email',
  PASSWORD_RESET: '/reset-password',
};

// Configuration des URLs externes
const EXTERNAL_CONFIG = {
  // URLs de fallback pour les images
  FALLBACK_IMAGES: {
    PRODUCT: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    USER: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    COMPANY: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  }
};

// Fonction utilitaire pour construire des URLs avec paramètres
const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

// Fonction utilitaire pour valider les URLs
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Export de toutes les configurations
module.exports = {
  API: API_CONFIG,
  FRONTEND: FRONTEND_CONFIG,
  IMAGE: IMAGE_CONFIG,
  SOCKET: SOCKET_CONFIG,
  REDIRECT: REDIRECT_CONFIG,
  EXTERNAL: EXTERNAL_CONFIG,
  UTILS: {
    buildUrl,
    isValidUrl,
  }
};
