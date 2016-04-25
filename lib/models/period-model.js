var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  start_year: { type: Number, required: true },
  end_year: { type: Number, required: true },
  period: { type: String },
  picture: { type: String }
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
