// src/models/Palco.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'

export class Palco extends Model {}

Palco.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,        // 'A', 'PRINCIPAL', 'B'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,    // 'PALCO A'
  },
  prioridad: {
    type: DataTypes.ENUM('alta','media','baja'),
    allowNull: true,
  },
  orden_visual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'palcos',
  timestamps: true, // created_at / updated_at
  underscored: true,
})
