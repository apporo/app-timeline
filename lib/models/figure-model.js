var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  periodId: { type: String, required: true },
  events: { type: Array },
  picture: { type: String }
}, {
  collection: 'figure'
});

module.exports = function(connection) {
  var schemaName = 'Figure';
  if (connection.modelNames().indexOf(schemaName) >= 0) {
    return connection.model(schemaName);
  }
  return connection.model(schemaName, DocumentSchema);
};
