const { Model, DataTypes } = require('sequelize');

class Seat extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        trip_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        seat_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('available', 'reserved', 'sold'),
          defaultValue: 'available',
          allowNull: false,
        },
        reserved_until: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reserved_by_session: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Seat',
        tableName: 'seats',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Trip, {
      foreignKey: 'trip_id',
      as: 'trip',
    });
  }
}

module.exports = Seat;