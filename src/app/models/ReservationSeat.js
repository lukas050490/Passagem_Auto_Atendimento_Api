const { Model, DataTypes } = require('sequelize');


class ReservationSeat extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        reservation_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        trip_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        seat_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'ReservationSeat',
        tableName: 'reservation_seats',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
      as: 'reservation',
    });
    this.belongsTo(models.Trip, {
      foreignKey: 'trip_id',
      as: 'trip',
    });

    this.belongsTo(models.Seat, {
      foreignKey: 'seat_id',
      as: 'seat',
    });
  }
}

module.exports = ReservationSeat;
