var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  disclaimer: mongoose.Schema.Types.Mixed
}, {
  collection: 'info'
});

module.exports = function(connection) {
  var schemaName = 'OrgInfo';
  if (connection.modelNames().indexOf(schemaName) >= 0) {
    return connection.model(schemaName);
  }
  return connection.model(schemaName, DocumentSchema);
};
