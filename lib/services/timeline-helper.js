'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('timeline:helper');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);

  var timelineMongodbWrapper = params.timelineMongodbWrapper;
  var timelineMongodbConfig = lodash.get(params, ['sandboxConfig', 'bridges', 'timelineMongodbWrapper', 'mongodb'], {});
  
  if (debuglog.isEnabled) {
    debuglog(' - timelineMongodbConfig: %s', JSON.stringify(timelineMongodbConfig, null, 2));
  }

  var self = this;
  
  self.getPeriods = function() {
    return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.PERIOD, {}, 0, 0);
  };

  self.getPeriodDetails = function(periodSlug) {
    var periodDetails = {};
    return Promise.resolve().then(function() {
      return timelineMongodbWrapper.findOneDocument(timelineMongodbConfig.cols.PERIOD, { slug: periodSlug});
    }).then(function(period) {
      lodash.assign(periodDetails, lodash.pick(period, ['_id', 'title', 'slug', 'description', 'period']));
      return Promise.all([
        timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FACT, {periodId: period._id.toString()}, 0, 0),
        timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FIGURE, {periodId: period._id.toString()}, 0, 0)
      ]);
    }).spread(function(facts, figures) {
      return lodash.assign(periodDetails, {facts: facts, figures: figures});
    });
  };

  self.getFacts = function() {
    return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FACT, {}, 0, 0);
  };

  self.getFactDetails = function(factSlug) {
    var factDetails = {};
    return Promise.resolve().then(function() {
      return timelineMongodbWrapper.findOneDocument(timelineMongodbConfig.cols.FACT, { slug: factSlug});
    }).then(function(fact) {
      if (debuglog.isEnabled) {
        debuglog(' - the fact with factSlug "%s" is: ', factSlug, JSON.stringify(fact));  
      }
      lodash.assign(factDetails, lodash.pick(fact, ['_id', 'name', 'slug']));
      if (lodash.isEmpty(fact)) return [];
      return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FACT_EVENT, {topicId: fact._id.toString()}, 0, 0);
    }).then(function(fact_events) {
      if (debuglog.isEnabled) {
        debuglog(' - the fact_events with factSlug "%s" are: ', factSlug, JSON.stringify(fact_events));  
      }
      if (lodash.isEmpty(fact_events)) return [];
      return Promise.mapSeries(fact_events, function(fact_event) {
        return timelineMongodbWrapper.getDocumentById(timelineMongodbConfig.cols.EVENT, fact_event.eventId);
      });
    }).then(function(events) {
      return lodash.assign(factDetails, {events: events});
    });
  };

  self.getFigures = function() {
    return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FIGURE, {}, 0, 0);
  };

  self.getFigureDetails = function(figureSlug) {
    var figureDetails = {};
    return Promise.resolve().then(function() {
      return timelineMongodbWrapper.findOneDocument(timelineMongodbConfig.cols.FIGURE, { slug: figureSlug});
    }).then(function(figure) {
      if (debuglog.isEnabled) {
        debuglog(' - the figure with figureSlug "%s" is: ', figureSlug, JSON.stringify(figure));  
      }
      lodash.assign(figureDetails, lodash.pick(figure, ['_id', 'name', 'slug']));
      if (lodash.isEmpty(figure)) return [];
      return timelineMongodbWrapper.findDocuments(timelineMongodbConfig.cols.FIGURE_EVENT, {figureId: figure._id.toString()}, 0, 0);
    }).then(function(figure_events) {
      if (debuglog.isEnabled) {
        debuglog(' - the figure_events with figureSlug "%s" are: ', figureSlug, JSON.stringify(figure_events));  
      }
      if (lodash.isEmpty(figure_events)) return [];
      return Promise.mapSeries(figure_events, function(figure_event) {
        return timelineMongodbWrapper.getDocumentById(timelineMongodbConfig.cols.EVENT, figure_event.eventId);
      });
    }).then(function(events) {
      return lodash.assign(figureDetails, {events: events});
    });
  };

  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "timelineHelper",
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
    "timelineMongodbWrapper": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
