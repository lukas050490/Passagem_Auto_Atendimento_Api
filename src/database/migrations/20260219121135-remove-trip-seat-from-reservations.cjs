'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reservations', 'trip_id');
    await queryInterface.removeColumn('reservations', 'seat_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('reservations', 'trip_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('reservations', 'seat_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
