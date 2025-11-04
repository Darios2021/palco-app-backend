// src/models/User.js
import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,     // createdAt / updatedAt (camelCase)
  underscored: false,   // 👈 asegura camelCase
})
