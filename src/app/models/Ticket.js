const { Model, DataTypes } = require('sequelize');

class Ticket extends Model {
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
          unique: true,
        },
        qr_code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        issued_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'tickets',
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

module.exports = Ticket;
