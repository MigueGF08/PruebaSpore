'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    static associate(models) {
      Car.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Car.init({
    brand: DataTypes.STRING,
    model: DataTypes.STRING,
    color: DataTypes.STRING, // Agregar color si lo usas
    licensePlate: {
      type: DataTypes.STRING,
      field: 'license_plate',
      allowNull: false,
      unique: true
    },
    imageName: {
      type: DataTypes.STRING,
      field: 'image_name',
      allowNull: true
    },
    imageType: {
      type: DataTypes.STRING,
      field: 'image_type',
      allowNull: true
    },
    imageSize: {
      type: DataTypes.INTEGER,
      field: 'image_size',
      allowNull: true
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT'),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('location');
        if (!rawValue) return null;
        
        // Si ya es un objeto con coordinates, devolverlo
        if (rawValue.coordinates) {
          return rawValue;
        }
        
        // Si es un string en formato WKT, parsearlo
        if (typeof rawValue === 'string') {
          // Formato: POINT(lng lat)
          const match = rawValue.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
          if (match) {
            return {
              type: 'Point',
              coordinates: [parseFloat(match[1]), parseFloat(match[2])]
            };
          }
        }
        
        return rawValue;
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Car',
    tableName: 'Cars',
    paranoid: true,
    underscored: true
  });

  return Car;
};