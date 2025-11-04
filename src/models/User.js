// src/models/User.js
import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED, // coincide con tu tabla actual
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  // ⚠️ La columna ya existente en tu DB es "passwordHash" (camelCase)
  passwordHash: {
    type: DataTypes.STRING(100), // coincide con varchar(100) que viste
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  // createdAt / updatedAt ya existen en camelCase, Sequelize los maneja solo
}, {
  tableName: 'users',
  underscored: false,   // 👈 importante: usar camelCase como en tu tabla
  timestamps: true,     // usa createdAt / updatedAt (camelCase)
})
