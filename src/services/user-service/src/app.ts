import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import sequelize from './config/db.js';
import { createUserRepository } from './user-service.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.USER_PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const userRepository = createUserRepository();

    // Register for new users
    app.post('/users/register', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password required' });
        }

        if (await userRepository.findByEmail(email)) {
          return res.status(409).json({ error: 'User exists' });
        }

        const user = await userRepository.createUser({
          email,
          password: await bcrypt.hash(password, 12)
        });

        res.status(201).json({ user: { id: user.id, email: user.email } });
      } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: 'Create failed' });
      }
    });

    // Login for existing users
    app.post('/users/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await userRepository.findByEmail(email);
        const valid = user && await bcrypt.compare(password, user.password);

        res.json({
          valid,
          user: valid ? { id: user.id, email: user.email } : null
        });
      } catch (error) {
        console.error('Validate error:', error);
        res.status(500).json({ error: 'Validation failed' });
      }
    });

    // GET All Users (called via API Gateway - already authenticated)
    app.get('/users', async (req, res) => {
      try {
        const users = await userRepository.findAll();
        res.json({ users });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get users' });
      }
    });

    // GET User by ID (called via API Gateway - already authenticated)
    app.get('/users/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid ID' });
        }

        const user = await userRepository.findById(id);
        if (!user) {
          return res.status(404).json({ error: 'Not found' });
        }

        res.json({ user: { id: user.id, email: user.email } });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
      }
    });

    // UPDATE User (called via API Gateway - already authenticated)
    app.put('/users/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid ID' });
        }

        const data = { ...req.body };

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 12);
        }

        const user = await userRepository.updateUser(id, data);
        if (!user) {
          return res.status(404).json({ error: 'Not found' });
        }

        res.json({ user: { id: user.id, email: user.email } });
      } catch (error) {
        res.status(500).json({ error: 'Update failed' });
      }
    });

    // DELETE User (called via API Gateway - already authenticated)
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid ID' });
        }

        const deleted = await userRepository.deleteUser(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Not found' });
        }

        res.json({ message: 'Deleted' });
      } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
      }
    });

    // System
    app.get('/health', (req, res) => res.json({ status: 'OK' }));
    app.get('/info', (req, res) => res.json({ service: 'user-service', version: '1.0.0' }));

    app.listen(PORT, () => console.log(`🚀 User service on port ${PORT}`));

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
})();

// Gracefully shutdown connection to db
const shutdown = async () => {
  await sequelize.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
