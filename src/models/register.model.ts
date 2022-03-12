import { Model, DataTypes } from "sequelize";
import MySQLClient from "../clients/mysql";
import User from "./user.model";

interface RegisterInstance extends Model {
  id: number;
  postId: number;
  userId: number;
}

const Register = MySQLClient.define<RegisterInstance>("Register", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  postId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
});

User.hasMany(Register, { foreignKey: "id" });
Register.belongsTo(User, { foreignKey: "userId" });

export default Register;
