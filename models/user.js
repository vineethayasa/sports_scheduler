"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Session, {
        foreignKey: "userId",
      });
      User.hasMany(models.Sport, {
        foreignKey: "userId",
      });
    }
    static addUser({ firstName, lastName, email, password, role }) {
      return this.create({ firstName, lastName, email, password, role });
    }
    static async getUser(userId) {
      return this.findByPk(userId);
    }
    static getAllUsers() {
      return this.findAll();
    }
    static async changePassword(id, password) {
      return await this.update(
        {
          password: password,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static async removeSport(sportId) {
      const sport = await this.sequelize.models.Sport.findByPk(sportId);
      if (sport) {
        await sport.update({ userId: null });
        return true;
      } else {
        return false;
      }
    }
  }
  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
