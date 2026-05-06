/**
 * Barrel export — permite importar todos os models de uma vez:
 *   const { User, Tip, EcoAction, Badge, Comment, Category } = require('../models');
 */
module.exports = {
  User:      require('./User'),
  Tip:       require('./Tip'),
  EcoAction: require('./EcoAction'),
  Badge:     require('./Badge'),
  Comment:   require('./Comment'),
  Category:  require('./Category'),
};
