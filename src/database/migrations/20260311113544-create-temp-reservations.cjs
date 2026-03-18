'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('temp_reservations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trip_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      seat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seats',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'converted'),
        defaultValue: 'active',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Criar índices
    await queryInterface.addIndex('temp_reservations', ['session_id']);
    await queryInterface.addIndex('temp_reservations', ['trip_id', 'seat_id']);
    await queryInterface.addIndex('temp_reservations', ['expires_at']);
    await queryInterface.addIndex('temp_reservations', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('temp_reservations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_temp_reservations_status";');
  }
};
