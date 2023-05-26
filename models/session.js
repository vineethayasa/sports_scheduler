'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.Sport, {
        foreignKey: "sportId",
      });
      Session.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addSession ({ name,date,address,players,count,cancelled,sportId,userId }) {
      return this.create({ name,date,address,players,count,cancelled,sportId,userId })
    }
    static getSessions() {
      return this.findAll()
    }
  }
  Session.init({
    name: DataTypes.STRING,
    date: DataTypes.DATE,
    address: DataTypes.STRING,
    players: DataTypes.ARRAY(DataTypes.STRING),
    count: DataTypes.INTEGER,
    cancelled: DataTypes.BOOLEAN,
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};