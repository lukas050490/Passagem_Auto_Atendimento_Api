const { Sequelize } = require('sequelize');
const config = require('./src/config/database.cjs');

const sequelize = new Sequelize(config.development);

async function listTrips() {
  try {
    const [results] = await sequelize.query('SELECT id, origin, destination, departure_time, arrival_time, service_type, price FROM trips');
    console.log('Viagens no banco:');
    results.forEach(trip => {
      console.log(`ID: ${trip.id}, Origem: ${trip.origin}, Destino: ${trip.destination}, Partida: ${trip.departure_time}, Chegada: ${trip.arrival_time}, Tipo: ${trip.service_type}, Preço: ${trip.price}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

listTrips();