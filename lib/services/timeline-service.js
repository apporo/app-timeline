'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('timeline:service');

var Service = function(params) {
  debuglog(' + constructor begin ...');
  
  Service.super_.apply(this);

  params = params || {};

  var self = this;
  
  self.getSandboxName = function() {
    return params.sandboxName;
  };
  
  self.logger = params.loggingFactory.getLogger();
  
  debuglog(' - attach plugin app-timeline into app-webserver');

  var cfgTimeline = lodash.get(params, ['sandboxConfig', 'plugins', 'appTimeline'], {});
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
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "generalConfig": {
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
