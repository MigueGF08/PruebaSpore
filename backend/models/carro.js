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
    licensePlate: DataTypes.STRING,
    location: DataTypes.GEOMETRY,
    image: DataTypes.STRING, // <--- asegúrate que existe este campo
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Car',
    paranoid: true
  });
  
  return Car;
};