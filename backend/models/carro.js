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

    // Método para obtener la imagen como base64
    getImageBase64() {
      if (this.imageData) {
        return this.imageData.toString('base64');
      }
      return null;
    }

    // Método para obtener data URL
    getImageDataUrl() {
      if (this.imageData && this.imageType) {
        return `data:${this.imageType};base64,${this.imageData.toString('base64')}`;
      }
      return null;
    }
  }
  
  Car.init({
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_plate'
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageData: {
      type: DataTypes.BLOB,
      allowNull: true,
      field: 'image_data'
    },
    imageName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_name'
    },
    imageType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_type',
      validate: {
        isIn: [['image/jpeg', 'image/png', 'image/gif', 'image/webp']]
      }
    },
    imageSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'image_size',
      validate: {
        min: 0,
        max: 5242880 // Máximo 5MB
      }
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT'),
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'user_id'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    modelName: 'Car',
    tableName: 'Cars',
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['deleted_at'] },
      { fields: ['image_name'] }
    ]
  });
  
  return Car;
};