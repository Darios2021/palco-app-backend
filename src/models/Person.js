// src/models/Person.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'

export class Person extends Model {}

Person.init({
  id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(120), allowNull: false },
  doc:         { type: DataTypes.STRING(50) },
  org:         { type: DataTypes.STRING(120) },
  cargo:       { type: DataTypes.STRING(120) },
  seat:        { type: DataTypes.STRING(10) },
  present:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  presentAt:   { type: DataTypes.DATE },
}, {
  sequelize,
  tableName: 'person',
  timestamps: true,          // created_at / updated_at
})
