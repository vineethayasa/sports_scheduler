"use strict";
const { Model } = require("sequelize");
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
    static getSportById(id) {
      return this.findByPk(id);
    }
    static async getSportByName(name) {
      const getSport = await this.findOne({
        where: { sport_name: name },
      });
      return getSport;
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
