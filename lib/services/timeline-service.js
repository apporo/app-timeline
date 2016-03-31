'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var lodash = require('devebot').pkg.lodash;
var debuglog = require('devebot').debug('timeline:service');
var bodyParser = require('body-parser');
var session = require('express-session');

var Service = function(params) {
  debuglog(' + constructor begin ...');
  
  Service.super_.apply(this);

  params = params || {};

  var self = this;
  
  self.getSandboxName = function() {
    return params.sandboxname;
  };
  
  self.logger = params.loggingFactory.getLogger();
  
  debuglog(' - attach plugin app-timeline into app-webserver');

  var cfgTimeline = lodash.get(params, ['sandboxconfig', 'plugins', 'appTimeline'], {});
  var contextPath = cfgTimeline.contextPath || '/timeline';

  var webserverTrigger = params.webserverTrigger;
  var express = webserverTrigger.getExpress();
  var position = webserverTrigger.getPosition();

  var app = express();

  app.set('views', __dirname + '/../../views');
  app.set('view engine', 'ejs');

  app.use(params.timelineController.buildRouter());
  
  webserverTrigger.inject(express.static(path.join(__dirname, '../../public/assets')),
      contextPath + '/assets', position.inRangeOfStaticFiles(), 'timeline-assets');

  webserverTrigger.inject(app, contextPath, position.inRangeOfMiddlewares(), 'timeline');

  self.getServiceInfo = function() {
    return {};
  };

  self.getServiceHelp = function() {
    return {};
  };
  
  debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "timelineService",
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
    "timelineController": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
