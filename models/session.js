"use strict";
const { Model, Op } = require("sequelize");
const Sport = require("./sport");
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
    static addSession({
      name,
      date,
      address,
      players,
      count,
      cancelled,
      sportId,
      userId,
    }) {
      return this.create({
        name,
        date,
        address,
        players,
        count,
        cancelled,
        sportId,
        userId,
      });
    }
    static async getUsersSessions(userId, sportId) {
      const today = new Date();
      return await this.findAll({
        where: {
          userId: userId,
          date: {
            [Op.gt]: today,
          },
          cancelled: false,
          sportId: sportId,
        },
      });
    }
    static async getCancelledSessions(sportId) {
      return await this.findAll({
        where: {
          cancelled: true,
          sportId: sportId,
        },
      });
    }
    static async getPreviousSessions(sportId) {
      const today = new Date();
      return await this.findAll({
        where: {
          sportId: sportId,
          date: {
            [Op.lt]: today,
          },
        },
      });
    }
    static async getOthersSessions(userId, sportId) {
      const today = new Date();
      return await this.findAll({
        where: {
          userId: {
            [Op.not]: userId,
          },
          date: {
            [Op.gt]: today,
          },
          [Op.not]: {
            players: {
              [Op.contains]: [userId],
            },
          },
          count: {
            [Op.gt]: 0,
          },
          cancelled: false,
          sportId: sportId,
        },
      });
    }
    static async getJoinedSessions(userId, sportId) {
      const today = new Date();
      return await this.findAll({
        where: {
          sportId: sportId,
          players: {
            [Op.contains]: [userId],
          },
          date: {
            [Op.gt]: today,
          },
          cancelled: false,
        },
      });
    }
    static async getUpcomingSessions(userId) {
      const today = new Date();
      return await this.findAll({
        where: {
          players: {
            [Op.contains]: [userId],
          },
          date: {
            [Op.gt]: today,
          },
          cancelled: false,
        },
      });
    }

    static updateSession(id, body) {
      return this.update(
        {
          date: body.date,
          address: body.address,
          players: body.players,
          count: body.count,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static cancelSession(id, reason) {
      return this.update(
        {
          cancelled: true,
          reason: reason,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static getSessions() {
      return this.findAll();
    }
    static async getSessionById(id) {
      return this.findByPk(id);
    }
    static async getSessionByName(name) {
      const getSport = await this.findOne({
        where: { name: name },
      });
      return getSport;
    }
    static async renameSportinSession(id, sport_name) {
      return await this.update(
        {
          name: sport_name,
        },
        {
          where: {
            sportId: id,
          },
        }
      );
    }
    static removeSessionbySport(sportId) {
      return this.destroy({
        where: {
          sportId: sportId,
        },
      });
    }
    static async getSessionCount(startDate, endDate) {
      const sessionCount = await Session.count({
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
          cancelled: false,
        },
      });
      return sessionCount;
    }
    static async getSessionsinTimePeriod(startDate, endDate) {
      return await Session.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });
    }
    static async getCancelledSessionCount(startDate, endDate) {
      const sessionCount = await Session.count({
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
          cancelled: true,
        },
      });
      return sessionCount;
    }
    static async getPopularSports(startTime, endTime) {
      const sessions = await Session.findAll({
        where: {
          date: {
            [Op.between]: [startTime, endTime],
          },
        },
      });

      const sportCounts = {};

      sessions.forEach((session) => {
        const { sportId } = session;

        if (sportId in sportCounts) {
          sportCounts[sportId]++;
        } else {
          sportCounts[sportId] = 1;
        }
      });

      const sortedSports = Object.entries(sportCounts).sort(
        (a, b) => b[1] - a[1]
      );

      return sortedSports.map(([sportId, count]) => ({
        sportId,
        count,
      }));
    }

    static async joinSession(userid, id) {
      const session = await this.getSessionById(id);
      session.players.push(userid);
      return this.update(
        {
          players: session.players,
          count: session.count - 1,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static async leaveSession(userid, id) {
      const session = await this.getSessionById(id);
      const playerIndex = session.players.indexOf(userid);

      if (playerIndex !== -1) {
        session.players.splice(playerIndex, 1);
        return this.update(
          {
            players: session.players,
            count: session.count + 1,
          },
          {
            where: {
              id: id,
            },
          }
        );
      }
    }
  }
  Session.init(
    {
      name: DataTypes.STRING,
      date: DataTypes.DATE,
      address: DataTypes.STRING,
      players: DataTypes.ARRAY(DataTypes.INTEGER),
      count: DataTypes.INTEGER,
      cancelled: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Session",
    }
  );
  return Session;
};
