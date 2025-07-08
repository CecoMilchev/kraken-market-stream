import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface User {
  id: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}

class UserModel extends Model<User, Optional<User, 'id' | 'createdAt' | 'updatedAt'>> implements User {
  public id!: number;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    }
  },
  {
    tableName: 'users',
    sequelize
  }
);

export default UserModel;