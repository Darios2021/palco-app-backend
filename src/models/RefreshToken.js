// src/models/RefreshToken.js
import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  jti: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  userId: {
    field: 'user_id',
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  replacedBy: {
    field: 'replaced_by',
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  revokedAt: {
    field: 'revoked_at',
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    field: 'expires_at',
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'refresh_tokens',
  underscored: true,
  timestamps: true,
})
