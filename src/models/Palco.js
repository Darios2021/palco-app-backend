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
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'palco', // si tu tabla se llama distinto, ajustá acá
  timestamps: false,
})
