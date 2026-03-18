'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('seats', 'status', {
      type: Sequelize.ENUM('available', 'reserved', 'sold'),
      defaultValue: 'available',
      allowNull: false,
    });

    await queryInterface.addColumn('seats', 'reserved_until', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('seats', 'reserved_by_session', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('seats', ['status']);
    await queryInterface.addIndex('seats', ['reserved_until']);
    await queryInterface.addIndex('seats', ['reserved_by_session']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('seats', 'status');
    await queryInterface.removeColumn('seats', 'reserved_until');
    await queryInterface.removeColumn('seats', 'reserved_by_session');

    // Remover o tipo ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_seats_status";');
  }
};
