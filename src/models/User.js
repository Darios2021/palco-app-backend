// src/models/User.js
import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  name: {
    type: DataTypes.STRING(190),
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
})
