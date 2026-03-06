const { Model, DataTypes } = require('sequelize');

class Company extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cnpj: {
          type: DataTypes.STRING(14),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
          allowNull: false,
          defaultValue: 'ACTIVE',
        },
      },
      {
        sequelize,
        tableName: 'companies',
      },
    );
  }

  static associate(models) {
    this.hasMany(models.Admin, { foreignKey: 'company_id' });
    this.hasMany(models.Trip, { foreignKey: 'company_id' });
  }
}

module.exports = Company;
