'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.pkg.bluebird;
var lodash = Devebot.pkg.lodash;
var debuglog = Devebot.debug('timeline:helper');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);

  var timelineMongodbWrapper = params.timelineMongodbWrapper;
  var timelineMongodbConfig = lodash.get(params, ['sandboxconfig', 'bridges', 'timelineMongodbWrapper', 'mongodb'], {});
  
  if (debuglog.isEnabled) {
    debuglog(' - timelineMongodbConfig: %s', JSON.stringify(timelineMongodbConfig, null, 2));
  }

  var self = this;
  
  self.getTopics = function() {
    return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.TOPIC, {}, 0, 0);
  };

  self.getEventsByTopic = function(topicSlug) {
    return Promise.resolve().then(function() {
      return timelineMongodbWrapper.findOneDocument(timelineMongodbConfig.cols.TOPIC, { slug: topicSlug});
    }).then(function(topic) {
      debuglog(' - the topic with topicSlug "%s" is: ', topicSlug, JSON.stringify(topic));
      if (lodash.isEmpty(topic)) return [];
      return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.TOPIC_EVENT, {topicId: topic._id.toString()}, 0, 0);
    }).then(function(topic_events) {
      debuglog(' - the topic_event with topicSlug "%s" are: ', topicSlug, JSON.stringify(topic_events));
      if (lodash.isEmpty(topic_events)) return [];
      return Promise.mapSeries(topic_events, function(topic_event) {
        return timelineMongodbWrapper.getDocumentById(timelineMongodbConfig.cols.EVENT, topic_event.eventId);
      });
    });
  };

  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "/timelineHelper",
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
    "timelineMongodbWrapper": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
