import { DataTypes } from 'sequelize'
export function initRefreshToken(sequelize){
  return sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jti: { type: DataTypes.STRING, unique: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    userAgent: { type: DataTypes.STRING },
    ip: { type: DataTypes.STRING },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    replacedBy: { type: DataTypes.STRING, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'refresh_tokens' })
}
