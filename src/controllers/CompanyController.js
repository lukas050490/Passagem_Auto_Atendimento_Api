const Company = require('../app/models/Company.js');

class CompanyController {
  async index(req, res) {
    const companies = await Company.findAll();
    return res.json(companies);
  }

  async create(req, res) {
    try {
      const { name, cnpj, status } = req.body;
      const company = await Company.create({ name, cnpj, status });
      return res.status(201).json(company);
    } catch (error) {
      console.error('Error creating company:', error);
      return res
        .status(500)
        .json({ error: 'Failed to create company', details: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, cnpj, status } = req.body;

      const company = await Company.findByPk(id);
      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      await company.update({ name, cnpj, status });
      return res.json(company);
    } catch (error) {
      console.error('Error updating company:', error);
      return res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const company = await Company.findByPk(id);
      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Verificar se existem admins ou viagens vinculadas
      const admins = await Admin.count({ where: { company_id: id } });
      const trips = await Trip.count({ where: { company_id: id } });

      if (admins > 0 || trips > 0) {
        return res.status(400).json({
          error: 'Não é possível excluir empresa com administradores ou viagens vinculadas'
        });
      }

      await company.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting company:', error);
      return res.status(500).json({ error: 'Erro ao deletar empresa' });
    }
  }

}

module.exports = new CompanyController();
