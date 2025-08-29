'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class Auth extends Model {
    static async login(email, password) {
      try {
        // Buscar usuario por email
        const user = await this.findOne({ 
          where: { email } 
        });

        if (!user) {
          return { 
            success: false, 
            error: 'Usuario no encontrado' 
          };
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return { 
            success: false, 
            error: 'Contraseña incorrecta' 
          };
        }

        // Verificar si la cuenta está activa
        if (user.isActive === false) {
          return { 
            success: false, 
            error: 'Cuenta desactivada' 
          };
        }

        // Excluir la contraseña de la respuesta
        const userResponse = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: new Date()
        };

        // Actualizar último login
        await user.update({ lastLogin: new Date() });

        return { 
          success: true, 
          user: userResponse 
        };

      } catch (error) {
        console.error('Error en login:', error);
        return { 
          success: false, 
          error: 'Error interno del servidor' 
        };
      }
    }
  }

  Auth.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    }
  }, {
    sequelize,
    modelName: 'Auth',
    tableName: 'Users', // Apunta a la misma tabla de usuarios
    timestamps: true,
    hooks: {
      beforeCreate: async (auth) => {
        if (auth.password) {
          const salt = await bcrypt.genSalt(10);
          auth.password = await bcrypt.hash(auth.password, salt);
        }
      },
      beforeUpdate: async (auth) => {
        if (auth.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          auth.password = await bcrypt.hash(auth.password, salt);
        }
      }
    }
  });

  return Auth;
};  

