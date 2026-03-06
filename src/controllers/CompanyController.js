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
}

module.exports = new CompanyController();
