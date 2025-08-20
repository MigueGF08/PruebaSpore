'use strict';
module.exports = (sequelize, DataTypes) => {
  const Usuarios = sequelize.define('Usuarios', {
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Usuarios'
  });

  Usuarios.associate = function(models) {
    Usuarios.hasMany(models.Carros, { foreignKey: 'id', as: 'carros' });
  };

  return Usuarios;
};