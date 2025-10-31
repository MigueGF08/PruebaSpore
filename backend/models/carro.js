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
    location: {
      type: DataTypes.JSON,
      field: 'location',
      allowNull: true,
      comment: 'Coordinates as {lat: number, lng: number}'
    },
    imagePath: {
      type: DataTypes.STRING,
      field: 'image_path',
      comment: 'Ruta relativa al archivo de imagen en el sistema de archivos'
    },
    imageName: {
      type: DataTypes.STRING,
      field: 'image_name',
      comment: 'Nombre original del archivo de imagen'
    },
    imageType: {
      type: DataTypes.STRING,
      field: 'image_type',
      comment: 'Tipo MIME de la imagen (ej: image/jpeg, image/png)'
    },
    imageSize: {
      type: DataTypes.INTEGER,
      field: 'image_size',
      comment: 'Tamaño del archivo de imagen en bytes'
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