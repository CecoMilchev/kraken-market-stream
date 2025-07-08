import { User, CreateUserDto } from '../types/user.js';
import UserModel from '../types/user.js';

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        try {
            const user = await UserModel.findOne({ where: { email } });
            return user ? user.toJSON() as User : null;
        } catch (error) {
            throw new Error(`Failed to find user by email: ${(error as Error).message}`);
        }
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        try {
            const user = await UserModel.create(userData);
            return user.toJSON() as User;
        } catch (error) {
            throw new Error(`Failed to create user: ${(error as Error).message}`);
        }
    }

    async findById(id: number): Promise<User | null> {
        try {
            const user = await UserModel.findByPk(id);
            return user ? user.toJSON() as User : null;
        } catch (error) {
            throw new Error(`Failed to find user by ID: ${(error as Error).message}`);
        }
    }

    async findAll(limit?: number, offset?: number): Promise<Omit<User, 'password'>[]> {
        try {
            const options: any = {
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            };

            if (limit) options.limit = limit;
            if (offset) options.offset = offset;

            const users = await UserModel.findAll(options);
            return users.map(user => user.toJSON() as Omit<User, 'password'>);
        } catch (error) {
            throw new Error(`Failed to find users: ${(error as Error).message}`);
        }
    }

    async updateUser(id: number, userData: Partial<Pick<User, 'email' | 'password'>>): Promise<User | null> {
        try {
            const [affectedCount] = await UserModel.update(userData, { where: { id } });
            if (affectedCount === 0) return null;

            const updatedUser = await UserModel.findByPk(id);
            return updatedUser ? updatedUser.toJSON() as User : null;
        } catch (error) {
            throw new Error(`Failed to update user: ${(error as Error).message}`);
        }
    }

    async deleteUser(id: number): Promise<boolean> {
        try {
            const deletedCount = await UserModel.destroy({ where: { id } });
            return deletedCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete user: ${(error as Error).message}`);
        }
    }
}
