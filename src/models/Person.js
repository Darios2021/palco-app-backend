// src/models/Person.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'

export class Person extends Model {}

Person.init(
  {
    id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name:      { type: DataTypes.STRING(120), allowNull: false },
    org:       { type: DataTypes.STRING(120) },
    cargo:     { type: DataTypes.STRING(120) },
    seat:      { type: DataTypes.STRING(10) },
    present:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // Atributo camelCase mapeado a 'present_at' por underscored:true
    presentAt: { type: DataTypes.DATE, field: 'present_at' },
  },
  {
    sequelize,
    tableName: 'person',
    timestamps: true,   // createdAt/updatedAt (mapeados a created_at/updated_at)
    underscored: true,
  }
)
