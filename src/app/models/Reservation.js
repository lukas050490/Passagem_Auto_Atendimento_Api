const { Model, DataTypes } = require('sequelize');

class Reservation extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        passenger_cpf: {
          type: DataTypes.STRING(11),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('PENDING', 'PAID', 'CANCELED', 'EXPIRED'),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'reservations',
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.hasMany(models.ReservationSeat, {
      foreignKey: 'reservation_id',
      as: 'reservation_seats',
    });
  }
}

module.exports = Reservation;
