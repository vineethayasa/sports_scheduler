"use strict";
const { Model, Op } = require("sequelize");
const Session = require("./session");
const User = require("./user");
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.hasMany(models.Session, {
        foreignKey: "sportId",
      });
      Sport.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addSport({ sport_name, userId }) {
      return this.create({ sport_name, userId });
    }
    static getSports() {
      return this.findAll();
    }
    static async getUsersSports(userId) {
      return await this.findAll({
        where: {
          userId: userId,
        },
      });
    }

    static async getOthersSports(userId) {
      return await this.findAll({
        where: {
          userId: {
            [Op.not]: userId,
          },
        },
      });
    }

    static async getSportById(id) {
      return this.findByPk(id);
    }
    static async getSportByName(name) {
      const getSport = await this.findOne({
        where: { sport_name: name },
      });
      return getSport;
    }
    static async remove(id) {
      // await User.removeSport(id);
      // await Session.removeSessionbySport(id, userId);
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static async renameSport(id, sport_name) {
      return await this.update(
        {
          sport_name: sport_name,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
  }
  Sport.init(
    {
      sport_name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sport",
    }
  );
  return Sport;
};
