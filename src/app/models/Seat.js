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
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'seats',
        indexes: [
          {
            unique: true,
            fields: ['trip_id', 'seat_number'],
          },
        ],
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
