var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  period: { type: String, required: true }
}, { 
  collection: 'period'
});

module.exports = function(connection) {
  var schemaName = 'Period';
  if (connection.modelNames().indexOf(schemaName) >= 0) {
    return connection.model(schemaName);
  }
  return connection.model(schemaName, DocumentSchema);
};
