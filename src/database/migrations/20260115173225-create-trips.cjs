'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trips', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      origin: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      destination: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      departure_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      arrival_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      service_type: {
        type: Sequelize.ENUM('LEITO', 'SEMI_LEITO', 'CONVENCIONAL'),
        allowNull: false,
      },

      price: {
        type: Sequelize.DECIMAL(10, 2),
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('trips');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_trips_service_type";',
    );
  },
};
