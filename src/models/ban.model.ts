import { Model, DataTypes } from "sequelize";
import MySQLClient from "../clients/mysql";

interface IBanInstance extends Model {
  id: number;
  userId: number;
  type: string;
  banDate: string;
  unbanDate: string;
}

const Ban = MySQLClient.define<IBanInstance>("Ban", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  type: {
    type: DataTypes.STRING,
  },
  banDate: {
    type: DataTypes.DATE,
  },
  unbanDate: {
    type: DataTypes.DATE,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: MySQLClient.literal("CURRENT_TIMESTAMP"),
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: MySQLClient.literal("CURRENT_TIMESTAMP"),
  },
});

export default Ban;