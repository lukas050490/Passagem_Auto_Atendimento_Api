'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        onDelete: 'RESTRICT',
      },

      seat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seats',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      passenger_cpf: {
        type: Sequelize.STRING(11),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'CANCELED', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('reservations', ['seat_id']);
    await queryInterface.addIndex('reservations', ['trip_id']);
    await queryInterface.addIndex('reservations', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reservations');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_reservations_status";',
    );
  },
};
