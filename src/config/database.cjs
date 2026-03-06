module.exports = {
  development: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'painel-passagens-db',

    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
  },
};
