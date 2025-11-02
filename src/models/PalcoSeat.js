// src/models/PalcoSeat.js
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db.js'
import { Palco } from './Palco.js'
import { Person } from './Person.js'

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
    allowNull: false,    // 'A','B','C','Q','L', etc
  },

  seat_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,    // 1..12
  },

  seat_code: {
    type: DataTypes.STRING(16),
    allowNull: false,    // 'A1', 'C6', 'Q10'
    unique: true,
  },

  assigned_to_person_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,     // FK logical to person.id
  },

  present: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  present_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'palco_seats',
  timestamps: true, // created_at / updated_at
  underscored: true,
})

/* Associations (no son estrictamente necesarias para que funcione,
   pero ayudan si después querés usar includes en Sequelize) */
PalcoSeat.belongsTo(Palco, {
  foreignKey: 'palco_id',
  as: 'palco',
})

PalcoSeat.belongsTo(Person, {
  foreignKey: 'assigned_to_person_id',
  as: 'person',
})
