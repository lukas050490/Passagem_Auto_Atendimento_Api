'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('companies', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Empresa Aguia',
        cnpj: '00000000000191',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('companies', {
      id: '11111111-1111-1111-1111-111111111111',
    });
  },
};
