import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import UserModel from './types/user.js';
import { createUserComponents } from './user-service.js';
import { createUserController } from './controllers/UserController.js';
import { createAuthMiddleware } from './middleware/AuthMiddleware.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.USER_PORT || 3001;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
