const { Model, DataTypes } = require('sequelize');

class TempReservation extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                session_id: {
                    type: DataTypes.STRING,
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
                expires_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM('active', 'expired', 'converted'),
                    defaultValue: 'active',
                },
            },
            {
                sequelize,
                modelName: 'TempReservation',
                tableName: 'temp_reservations',
                timestamps: true,
                indexes: [
                    {
                        fields: ['session_id'],
                    },
                    {
                        fields: ['trip_id', 'seat_id'],
                    },
                    {
                        fields: ['expires_at'],
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
        this.belongsTo(models.Seat, {
            foreignKey: 'seat_id',
            as: 'seat',
        });
    }
}

module.exports = TempReservation;