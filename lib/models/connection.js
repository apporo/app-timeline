var mongoose = require('mongoose');

var Devebot = require('devebot');
var debug = Devebot.require('debug');
var debuglog = debug('mongoose:connection');

module.exports = function(params) {
  params = params || {};
  
  var mongoURI = params.mongoURI;
  
  var connection = mongoose.createConnection(mongoURI);

  // When successfully connected
  connection.on('connected', function() {
    debuglog('Mongoose connected to [' + mongoURI + ']');
  });

  // When the connection is disconnected
  connection.on('disconnected', function() {
    debuglog('Mongoose disconnected from [' + mongoURI + ']');
  });

  // If the connection throws an error
  connection.on('error', function(err) {
    debuglog('Mongoose connection[' + mongoURI + '] error:' + err);
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    connection.close(function () {
      debuglog('Mongoose connection[' + mongoURI + '] closed & app exit');
      process.exit(0);
    });
  });

  return connection;
}
