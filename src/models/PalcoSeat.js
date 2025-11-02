// src/models/PalcoSeat.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'
import { Palco } from './Palco.js'

export class PalcoSeat extends Model {}

PalcoSeat.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  // FK -> palco.id
  palcoId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'palco_id',
  },

  // Ej: "A1", "B5", "D10"
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },

  // letra de fila ("A","B","C","D"...)
  row: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },

  // número de columna (1,2,3,...)
  col: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'palco_seat',
  timestamps: false,
})

// relaciones (por si más adelante las usamos con include)
Palco.hasMany(PalcoSeat, {
  as: 'seats',
  foreignKey: 'palco_id',
})
PalcoSeat.belongsTo(Palco, {
  as: 'palco',
  foreignKey: 'palco_id',
})
