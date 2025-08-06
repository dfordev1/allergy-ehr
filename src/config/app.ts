// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  cache: {
    defaultTtl: number;
    maxSize: number;
    persistToStorage: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    pageSize: number;
    toastDuration: number;
    animationDuration: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
  };
  features: {
    offlineMode: boolean;
    analytics: boolean;
    notifications: boolean;
    exportData: boolean;
    advancedSearch: boolean;
  };
  medical: {
    maxPatientsPerPage: number;
    maxTestResultsPerPatient: number;
    allergenCategories: string[];
    testTypes: string[];
    workingHours: {
      start: string;
      end: string;
      workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    };
  };
}

const config: AppConfig = {
  app: {
    name: 'Skin Track Aid',
    version: '1.0.0',
    environment: (import.meta.env.MODE as any) || 'development',
    debugMode: import.meta.env.DEV || false
  },
  api: {
    baseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://dmcuunucjmmofdfvteta.supabase.co',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    persistToStorage: true
  },
  ui: {
    theme: 'system',
    pageSize: 10,
    toastDuration: 4000,
    animationDuration: 200
  },
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 3,
    passwordMinLength: 8
  },
  features: {
    offlineMode: true,
    analytics: true,
    notifications: true,
    exportData: true,
    advancedSearch: true
  },
  medical: {
    maxPatientsPerPage: 50,
    maxTestResultsPerPatient: 100,
    allergenCategories: [
      'MITE',
      'POLLENS',
      'TREES',
      'FUNGI',
      'DUST MIX',
      'EPITHELIA',
      'INSECTS'
    ],
    testTypes: [
      'Skin Prick Test',
      'Intradermal Test',
      'Patch Test',
      'Food Challenge Test',
      'Drug Challenge Test'
    ],
    workingHours: {
      start: '08:00',
      end: '18:00',
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    }
  }
};

// Environment-specific overrides
if (config.app.environment === 'production') {
  config.app.debugMode = false;
  config.cache.defaultTtl = 15 * 60 * 1000; // 15 minutes in production
  config.ui.toastDuration = 3000;
}

if (config.app.environment === 'development') {
  config.app.debugMode = true;
  config.cache.defaultTtl = 2 * 60 * 1000; // 2 minutes in development
  config.ui.toastDuration = 5000;
}

// Validation
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.app.name) errors.push('App name is required');
  if (!config.app.version) errors.push('App version is required');
  if (!config.api.baseUrl) errors.push('API base URL is required');
  
  if (config.api.timeout < 1000) errors.push('API timeout must be at least 1000ms');
  if (config.api.retryAttempts < 0) errors.push('Retry attempts must be non-negative');
  
  if (config.cache.defaultTtl < 0) errors.push('Cache TTL must be non-negative');
  if (config.cache.maxSize < 1) errors.push('Cache max size must be at least 1');
  
  if (config.ui.pageSize < 1) errors.push('Page size must be at least 1');
  if (config.ui.toastDuration < 1000) errors.push('Toast duration must be at least 1000ms');
  
  if (config.security.sessionTimeout < 60000) errors.push('Session timeout must be at least 1 minute');
  if (config.security.passwordMinLength < 6) errors.push('Password min length must be at least 6');
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

validateConfig(config);

export default config;

// Utility functions
export const getConfig = () => config;

export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return config.features[feature];
};

export const isDevelopment = (): boolean => {
  return config.app.environment === 'development';
};

export const isProduction = (): boolean => {
  return config.app.environment === 'production';
};

export const getApiConfig = () => config.api;
export const getCacheConfig = () => config.cache;
export const getUIConfig = () => config.ui;
export const getSecurityConfig = () => config.security;
export const getMedicalConfig = () => config.medical;