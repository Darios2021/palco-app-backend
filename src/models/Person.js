// src/models/Person.js  (FINAL)
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'

export class Person extends Model {}

Person.init(
  {
    id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name:      { type: DataTypes.STRING(120), allowNull: false },
    doc:       { type: DataTypes.STRING(50) },
    org:       { type: DataTypes.STRING(120) },
    cargo:     { type: DataTypes.STRING(120) },
    seat:      { type: DataTypes.STRING(10) },
    present:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // Usamos atributo camelCase, Sequelize lo mapea a 'present_at' por underscored:true
    presentAt: { type: DataTypes.DATE, field: 'present_at' },
  },
  {
    sequelize,
    tableName: 'person',
    timestamps: true,     // usa createdAt/updatedAt como atributos…
    underscored: true,    // …pero los mapea a created_at / updated_at en la tabla
  }
)
