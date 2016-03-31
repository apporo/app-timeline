'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var lodash = Devebot.pkg.lodash;
var debuglog = Devebot.debug('timeline:controller');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);

  var contextPath = lodash.get(params, ['sandboxconfig', 'plugins', 'appTimeline', 'contextPath'], '/timeline');

  var self = this;
  var webserverTrigger = params.webserverTrigger;
  var express = webserverTrigger.getExpress();

  self.buildRouter = function() {
    var router = express.Router();
    
    router.route('/topics').get(function(req, res, next) {
      res.render('pages/index', {
        contextPath: contextPath,
        events: []
      }); //next();
    });

    router.route('/topic/:topicSlug').get(function(req, res, next) {
      var topicSlug = req.params.topicSlug;
      if (debuglog.isEnabled) {
        debuglog(' - /topic/:topicSlug is request, topic slug: %s', topicSlug);
      }
      params.timelineHelper.getEventsByTopic(topicSlug).then(function(events) {
        res.render('pages/index', {
          contextPath: contextPath,
          events: events
        }, function(err, html) {
          res.send(html); // res.write(html);
        });
      }, function errorHandler(err) {
        debuglog(' - Error on getting events by topic: %s', err);
        res.status(404);
        res.render('pages/error', {
          contextPath: contextPath
        });
      });
    });
    
    return router;
  };

  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "/timelineController",
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
    "timelineHelper": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
