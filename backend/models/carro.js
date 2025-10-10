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
    licensePlate: {
      type: DataTypes.STRING,
      field: 'license_plate',
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.GEOMETRY,
      field: 'location'
    },
    image: DataTypes.STRING,
    imageData: {
      type: DataTypes.BLOB,
      field: 'image_data'
    },
    imageName: {
      type: DataTypes.STRING,
      field: 'image_name'
    },
    imageType: {
      type: DataTypes.STRING,
      field: 'image_type'
    },
    imageSize: {
      type: DataTypes.INTEGER,
      field: 'image_size'
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