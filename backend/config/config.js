require('dotenv').config();

const common = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  logging: false,
  
};

module.exports = {
  development: {
    username: 'postgres',
    password: '12345',
    database: 'database_development',
    host: '127.0.0.1',
    dialect: 'postgres',
    ...common,
  },
  // Configuración adicional para la aplicación
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
};
