'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var debuglog = require('devebot').debug('timeline');
var bodyParser = require('body-parser');
var session = require('express-session');

var Service = function(params) {
  debuglog(' + constructor begin ...');
  
  Service.super_.call(this);

  params = params || {};

  var self = this;
  
  self.getSandboxName = function() {
    return params.sandboxname;
  };
  
  var loggingFactory = params.loggingFactory;
  self.logger = loggingFactory.getLogger();
  
  debuglog(' - plug timeline into webserver');

  var webserverTrigger = params.webserverTrigger;
  var apporo = webserverTrigger.getApporo();
  var express = webserverTrigger.getExpress();
  
  var app = express();
  app.use(session({ 
    secret: 's3cr3tk3yf0rw3bs3rv3r',
    saveUninitialized: true,
    resave: true
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/assets', express.static(path.join(__dirname, '../../public/assets')));
  
  apporo.use('/timeline', app);

  self.getServiceInfo = function() {
    return {};
  };

  self.getServiceHelp = function() {
    return {};
  };
  
  debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "/timelineService",
  "type": "object",
  "properties": {
    "sandboxname": {
      "type": "string"
    },
    "sandboxconfig": {
      "type": "object"
    },
    "profileconfig": {
      "type": "object"
    },
    "generalconfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
