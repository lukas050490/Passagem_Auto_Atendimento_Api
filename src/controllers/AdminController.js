
const bcrypt = require('bcryptjs');
const Admin = require('../app/models/Admin');

class AdminController {
    // Listar todos os administradores (apenas super admin)
    async index(req, res) {
        try {
            // Verificar se é super admin
            if (req.adminRole !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Acesso negado. Apenas super administradores podem listar admins.' });
            }

            const admins = await Admin.findAll({
                attributes: ['id', 'name', 'email', 'role', 'company_id', 'created_at'],
            });

            return res.json(admins);
        } catch (error) {
            console.error('Error listing admins:', error);
            return res.status(500).json({ error: 'Erro ao listar administradores' });
        }
    }

    // Criar novo administrador (apenas super admin)
    async create(req, res) {
        try {
            // Verificar se é super admin
            if (req.adminRole !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Acesso negado. Apenas super administradores podem criar admins.' });
            }

            const { name, email, password, role, company_id } = req.body;

            // Validações
            if (!name || !email || !password || !company_id) {
                return res.status(400).json({ error: 'Nome, email, senha e empresa são obrigatórios' });
            }

            // Verificar se email já existe
            const existingAdmin = await Admin.findOne({ where: { email } });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            const admin = await Admin.create({
                name,
                email,
                password: hashedPassword,
                role: role || 'ADMIN',
                company_id,
            });

            return res.status(201).json({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                company_id: admin.company_id,
            });
        } catch (error) {
            console.error('Error creating admin:', error);
            return res.status(500).json({ error: 'Erro ao criar administrador' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, password, role, company_id } = req.body;

            // Verificar se o admin existe
            const admin = await Admin.findByPk(id);
            if (!admin) {
                return res.status(404).json({ error: 'Administrador não encontrado' });
            }

            // Verificar se o email já existe (se estiver mudando)
            if (email && email !== admin.email) {
                const existingAdmin = await Admin.findOne({ where: { email } });
                if (existingAdmin) {
                    return res.status(400).json({ error: 'Email já cadastrado' });
                }
            }

            // Atualizar campos
            if (name) admin.name = name;
            if (email) admin.email = email;
            if (password) {
                admin.password = await bcrypt.hash(password, 10);
            }
            if (role && req.adminRole === 'SUPER_ADMIN') {
                admin.role = role;
            }
            if (company_id && req.adminRole === 'SUPER_ADMIN') {
                admin.company_id = company_id;
            }

            await admin.save();

            return res.json({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                company_id: admin.company_id
            });
        } catch (error) {
            console.error('Error updating admin:', error);
            return res.status(500).json({ error: 'Erro ao atualizar administrador' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar se é super admin
            if (req.adminRole !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Acesso negado. Apenas super administradores podem deletar admins.' });
            }

            // Não permitir deletar o próprio super admin
            if (req.adminId === id) {
                return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
            }

            const admin = await Admin.findByPk(id);
            if (!admin) {
                return res.status(404).json({ error: 'Administrador não encontrado' });
            }

            await admin.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting admin:', error);
            return res.status(500).json({ error: 'Erro ao deletar administrador' });
        }
    }
}

module.exports = new AdminController();