/**
 * Atelie Sagrado ERP - Entry File de Producao (Node.js 22 / Hostinger)
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
await import('./dist/server.cjs');
