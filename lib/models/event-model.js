var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  headline: { type: String, required: true },
  text: { type: String, required: true },
  group: { type: String },
  image: { type: String },
  start_date: {
    year: { type: Number, required: true },
    month: { type: Number },
    day: { type: Number }
  },
  end_date: {
    year: { type: Number },
    month: { type: Number },
    day: { type: Number }
  },
  display_date: { type: String }
}, {
  collection: 'eventslides'
});

module.exports = function(connection) {
  var schemaName = 'Event';
  if (connection.modelNames().indexOf(schemaName) >= 0) {
    return connection.model(schemaName);
  }
  return connection.model(schemaName, DocumentSchema);
};
