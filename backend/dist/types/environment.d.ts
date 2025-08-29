export interface DatabaseConfig {
    URL: string;
    HOST: string;
    PORT: number;
    NAME: string;
    USER: string;
    PASSWORD: string;
    SSL: boolean;
    MAX_CONNECTIONS: number;
    CONNECTION_TIMEOUT: number;
}
export interface RedisConfig {
    HOST: string;
    PORT: number;
    PASSWORD: string;
    URL?: string;
    MAX_RETRIES: number;
    RETRY_DELAY: number;
}
export interface AuthConfig {
    SECRET: string;
    SESSION_EXPIRES_IN: number;
    TOKEN_EXPIRES_IN: number;
    REFRESH_TOKEN_EXPIRES_IN: number;
    BCRYPT_ROUNDS: number;
    TRUST_HOST: boolean;
}
export interface CorsConfig {
    ORIGINS: string[];
    CREDENTIALS: boolean;
}
export interface EmailConfig {
    SENDGRID_API_KEY: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    REPLY_TO: string;
}
export interface SmsConfig {
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
}
export interface UploadConfig {
    MAX_FILE_SIZE: number;
    ALLOWED_EXTENSIONS: string[];
    UPLOAD_DIR: string;
}
export interface LoggingConfig {
    LEVEL: 'error' | 'warn' | 'info' | 'debug';
    INCLUDE_STACK: boolean;
    LOG_TO_FILE: boolean;
    LOG_FILE_PATH: string;
}
export interface RateLimitingConfig {
    WINDOW_MS: number;
    MAX_REQUESTS: number;
    ENABLED: boolean;
}
export interface SecurityConfig {
    HELMET_ENABLED: boolean;
    HTTPS_ONLY: boolean;
    SECURE_COOKIES: boolean;
    SAME_SITE_COOKIES: 'strict' | 'lax' | 'none';
}
export interface ApiConfig {
    BASE_URL: string;
    PREFIX: string;
    VERSION: string;
    PAGINATION_DEFAULT_LIMIT: number;
    PAGINATION_MAX_LIMIT: number;
}
export interface FlagsConfig {
    DEVELOPMENT: boolean;
    PRODUCTION: boolean;
    DEBUG: boolean;
    ENABLE_SWAGGER: boolean;
    ENABLE_METRICS: boolean;
    ENABLE_HEALTH_CHECK: boolean;
}
export interface ServicesConfig {
    FRONTEND_URL: string;
    WEBHOOK_BASE_URL: string;
}
export interface EnvironmentConfig {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    HOST: string;
    DATABASE: DatabaseConfig;
    REDIS: RedisConfig;
    AUTH: AuthConfig;
    CORS: CorsConfig;
    EMAIL: EmailConfig;
    SMS: SmsConfig;
    UPLOAD: UploadConfig;
    LOGGING: LoggingConfig;
    RATE_LIMITING: RateLimitingConfig;
    SECURITY: SecurityConfig;
    API: ApiConfig;
    FLAGS: FlagsConfig;
    SERVICES: ServicesConfig;
}
export type EnvironmentVariable = 'NODE_ENV' | 'PORT' | 'HOST' | 'DATABASE_URL' | 'DB_HOST' | 'DB_PORT' | 'DB_NAME' | 'DB_USER' | 'DB_PASSWORD' | 'DB_SSL' | 'DB_MAX_CONNECTIONS' | 'DB_CONNECTION_TIMEOUT' | 'REDIS_HOST' | 'REDIS_PORT' | 'REDIS_PASSWORD' | 'REDIS_URL' | 'REDIS_MAX_RETRIES' | 'REDIS_RETRY_DELAY' | 'BETTER_AUTH_SECRET' | 'JWT_SECRET' | 'SESSION_EXPIRES_IN' | 'TOKEN_EXPIRES_IN' | 'REFRESH_TOKEN_EXPIRES_IN' | 'BCRYPT_ROUNDS' | 'TRUST_HOST' | 'CORS_ORIGINS' | 'CORS_CREDENTIALS' | 'SENDGRID_API_KEY' | 'EMAIL_FROM' | 'EMAIL_FROM_NAME' | 'EMAIL_REPLY_TO' | 'TWILIO_ACCOUNT_SID' | 'TWILIO_AUTH_TOKEN' | 'TWILIO_PHONE_NUMBER' | 'MAX_FILE_SIZE' | 'UPLOAD_ALLOWED_EXTENSIONS' | 'UPLOAD_DIR' | 'LOG_LEVEL' | 'LOG_INCLUDE_STACK' | 'LOG_TO_FILE' | 'LOG_FILE_PATH' | 'RATE_LIMIT_WINDOW_MS' | 'RATE_LIMIT_MAX_REQUESTS' | 'RATE_LIMIT_ENABLED' | 'HELMET_ENABLED' | 'HTTPS_ONLY' | 'SECURE_COOKIES' | 'SAME_SITE_COOKIES' | 'API_BASE_URL' | 'API_PREFIX' | 'API_VERSION' | 'API_PAGINATION_DEFAULT_LIMIT' | 'API_PAGINATION_MAX_LIMIT' | 'DEBUG' | 'ENABLE_SWAGGER' | 'ENABLE_METRICS' | 'ENABLE_HEALTH_CHECK' | 'FRONTEND_URL' | 'WEBHOOK_BASE_URL';
//# sourceMappingURL=environment.d.ts.map