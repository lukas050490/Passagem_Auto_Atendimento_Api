const { Model, DataTypes } = require('sequelize');

class Trip extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        company_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        origin: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        destination: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        departure_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        arrival_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        service_type: {
          type: DataTypes.ENUM('LEITO', 'SEMI_LEITO', 'CONVENCIONAL'),
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'trips',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id' });
    this.hasMany(models.Seat, { foreignKey: 'trip_id', as: 'seats' });
  }
}

module.exports = Trip;
