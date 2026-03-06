'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('admin123', 8);

    await queryInterface.bulkInsert('admins', [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Super Admin',
        email: 'admin@system.com',
        password: passwordHash,
        role: 'SUPER_ADMIN',
        company_id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', {
      id: '22222222-2222-2222-2222-222222222222',
    });
  },
};
