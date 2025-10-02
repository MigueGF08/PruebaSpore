require('dotenv').config();

const common = {
  dialect: process.env.DB_DIALECT || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  logging: false,
};

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || 'database_development',
    ...common,
  }
};
