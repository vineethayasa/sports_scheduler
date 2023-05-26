'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull:false
      },
      date: {
        type: Sequelize.DATE,
        allowNull:false
      },
      address: {
        type: Sequelize.STRING,
        allowNull:false
      },
      players: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull:false
      },
      count: {
        type: Sequelize.INTEGER
      },
      cancelled: {
        type: Sequelize.BOOLEAN,
        allowNull:false
      },
      reason: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};