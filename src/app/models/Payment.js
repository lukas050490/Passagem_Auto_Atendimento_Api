const { Model, DataTypes } = require('sequelize');

class Payment extends Model {
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
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        method: {
          type: DataTypes.ENUM('PIX', 'CARD'),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'payments',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
      as: 'reservation',
    });
  }
}

module.exports = Payment;
