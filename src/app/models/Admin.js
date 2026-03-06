const { Model, DataTypes } = require('sequelize');

class Admin extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        role: DataTypes.ENUM('ADMIN', 'SUPER_ADMIN'),
        company_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'admins',
      },
    );
  }
  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id' });
  }
}

module.exports = Admin;
