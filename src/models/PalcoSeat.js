// src/models/PalcoSeat.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'

export class PalcoSeat extends Model {}

PalcoSeat.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  palco_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  row_letter: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  seat_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  seat_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'palco_seat', // OJO: si en tu DB se llama "palco_seats", cambialo acá para que coincida EXACTO
  timestamps: false,
})
