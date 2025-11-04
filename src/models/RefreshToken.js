// src/models/RefreshToken.js
import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'
import { User } from './User.js'

export const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  jti: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  userId: {                 // ⚠️ camelCase como en tu tabla
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  replacedBy: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,     // usa createdAt / updatedAt
  underscored: false,   // ⚠️ importante (camelCase en DB)
})

// Asociaciones (FK en camelCase)
RefreshToken.belongsTo(User, { foreignKey: 'userId' })
User.hasMany(RefreshToken, { foreignKey: 'userId' })
