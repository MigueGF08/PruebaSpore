'use strict';
module.exports = (sequelize, DataTypes) => {
  const Carros = sequelize.define('Carros', {
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuarios',
        key: 'id'
      }
    },
    placas: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitud: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    longitud: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  }, {
    tableName: 'Carros'
  });

  Carros.associate = function(models) {
    Carros.belongsTo(models.Usuarios, { foreignKey: 'id', as: 'usuario' });
  };

  return Carros;
};