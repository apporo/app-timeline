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

  var timelineMongooseWrapper = params.timelineMongooseWrapper;
  var cfgTimeline = lodash.get(params, ['sandboxConfig', 'plugins', 'appTimeline'], {});
  var cfgResources = lodash.get(cfgTimeline, ['resources'], {});
  
  var infoModel = timelineMongooseWrapper.registerModel('InfoModel', {
    disclaimer: timelineMongooseWrapper.getSchema().Types.Mixed
  }, {
    collection: 'info'
  });

  var periodModel = timelineMongooseWrapper.registerModel('PeriodModel', {
    title: { type: String, required: true, index: true },
    brief: { type: String },
    description: { type: String },
    slug: { type: String, required: true, unique: true },
    start_year: { type: Number, required: true },
    end_year: { type: Number, required: true },
    period: { type: String },
    picture: { type: String }
  }, {
    collection: 'period'
  });

  var eventModel = timelineMongooseWrapper.registerModel('EventModel', {
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
    collection: 'event'
  });

  var factModel = timelineMongooseWrapper.registerModel('FactModel', {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true },
    periodId: { type: String, required: true },
    periodName: { type: String },
    events: { type: Array },
    picture: { type: String }
  }, {
    collection: 'fact'
  });

  var figureModel = timelineMongooseWrapper.registerModel('FigureModel', {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true },
    periodId: { type: String, required: true },
    events: { type: Array },
    picture: { type: String }
  }, {
    collection: 'figure'
  });

  var self = this;

  self.getDisclaimer = function() {
    return Promise.resolve().then(function() {
      var query = infoModel.findOne({}).select('disclaimer');
      return Promise.promisify(query.exec, {context: query})();
    }).then(function(data) {
      if (debuglog.isEnabled) {
        debuglog(' - disclaimer content: %s', JSON.stringify(data, null, 2));
      }
      return data;
    });
  };

  self.getRandomPeriods = function(count) {
    count = count || 0;
    if (debuglog.isEnabled) {
      debuglog(' - getRandomPeriods(%s)', count);
    }
    return Promise.resolve().then(function() {
      return Promise.promisify(periodModel.count, { context: periodModel })();
    }).then(function(total) {
      var query = periodModel.find({}).sort({start_year:1}).skip(getStartPosition(count, total)).limit(count);
      return Promise.promisify(query.exec, {context: query})();
    });
  };

  self.getPeriods = function(count, start, criteria, sorting, options) {
    count = count || 0;
    start = start || 0;
    criteria = criteria || {};
    sorting = sorting || {};
    if (lodash.isEmpty(sorting)) {
      sorting = {start_year: 1};
    }
    options = options || {};
    var query = periodModel.find(criteria).sort(sorting).skip(start).limit(count);
    return Promise.promisify(query.exec, {context: query})();
  };

  self.countPeriods = function(criteria) {
    criteria = criteria || {};
    return Promise.promisify(periodModel.count, {context: periodModel})(criteria);
  };

  self.getPeriodDetails = function(periodSlug) {
    var periodDetails = {};
    return Promise.resolve().then(function() {
      return Promise.promisify(function(done) {
        periodModel.findOne({ slug: periodSlug }, done);
      })();
    }).then(function(period) {
      if (debuglog.isEnabled) {
        debuglog(' - the period with periodSlug "%s" is: ', periodSlug, JSON.stringify(period));  
      }
      lodash.assign(periodDetails, lodash.pick(period, pickSchema(periodModel, ['_id', '__v'])));
      var factQuery = factModel.find({ periodId: period._id });
      var figureQuery = figureModel.find({ periodId: period._id });
      return Promise.all([
        Promise.promisify(factQuery.exec, {context: factQuery})(),
        Promise.promisify(figureQuery.exec, {context: figureQuery})()
      ]);
    }).spread(function(facts, figures) {
      return lodash.assign(periodDetails, {facts: facts, figures: figures});
    });
  };

  self.getPeriodById = function(id) {
    return Promise.promisify(periodModel.findById, {context: periodModel})(id);
  };

  self.createPeriod = function(jsondata) {
    var period = new periodModel(lodash.pick(jsondata, pickSchema(periodModel, ['_id', '__v'])));
    return Promise.promisify(period.save, {context: period})();
  };

  self.updatePeriod = function(id, jsondata) {
    return Promise.promisify(periodModel.update, {context: periodModel})
      ({_id: id}, lodash.pick(jsondata, pickSchema(periodModel, ['_id', '__v'])));
  };

  self.deletePeriod = function(id) {
    return Promise.promisify(periodModel.remove, {context: periodModel})({_id: id});
  };

  self.getEvents = function(count, start, criteria, options) {
    count = count || 0;
    start = start || 0;
    criteria = criteria || {};
    options = options || {};

    var ctx = {};

    var query = eventModel.find(criteria).skip(start).limit(count);
    return Promise.promisify(query.exec, {context: query})();
  };

  self.countEvents = function(criteria) {
    criteria = criteria || {};
    return Promise.promisify(eventModel.count, {context: eventModel})(criteria);
  };

  self.getEventById = function(id) {
    return Promise.resolve().then(function() {
      return Promise.promisify(eventModel.findById, {context: eventModel})(id);  
    }).then(function(event) {
      var eventProp = lodash.pick(event, pickSchema(eventModel, ['__v']));
      eventProp.start_date = convertDateToText(event.start_date);
      eventProp.end_date = convertDateToText(event.end_date);
      return eventProp;
    });
  };

  self.createEvent = function(jsondata) {
    var eventProp = lodash.pick(jsondata, pickSchema(eventModel, ['_id', '__v']));
    eventProp.start_date = convertTextToDate(jsondata.start_date);
    eventProp.end_date = convertTextToDate(jsondata.end_date);
    var event = new eventModel(eventProp);
    return Promise.promisify(event.save, {context: event})();
  };

  self.updateEvent = function(id, jsondata) {
    var eventProp = lodash.pick(jsondata, pickSchema(eventModel, ['_id', '__v']));
    eventProp.start_date = convertTextToDate(jsondata.start_date);
    eventProp.end_date = convertTextToDate(jsondata.end_date);
    return Promise.promisify(eventModel.update, {context: eventModel})({_id: id}, eventProp);
  };

  self.deleteEvent = function(id) {
    return Promise.promisify(eventModel.remove, {context: eventModel})({_id: id});
  };

  self.getRandomFacts = function(count) {
    count = count || 0;
    if (debuglog.isEnabled) {
      debuglog(' - getRandomFacts(%s)', count);
    }
    return Promise.resolve().then(function() {
      return Promise.promisify(factModel.count, { context: factModel })();
    }).then(function(total) {
      return self.getFacts(count, getStartPosition(count, total), {}, {
        keepOriginalData: false
      });
    });
  };

  self.getFacts = function(count, start, criteria, options) {
    count = count || 0;
    start = start || 0;
    criteria = criteria || {};
    options = options || {};

    var ctx = {};

    var query = factModel.find(criteria).skip(start).limit(count);
    if (options.keepOriginalData) {
      return Promise.promisify(query.exec, {context: query})();
    }

    return Promise.resolve().then(function() {
      return Promise.promisify(query.exec, {context: query})();
    }).then(function (facts) {
      ctx.facts = facts;

      var periodRefs = lodash.filter(facts, function(fact) { 
        return lodash.isEmpty(fact.periodName) || lodash.isEmpty(fact.periodSlug)
      });
      periodRefs = lodash.map(periodRefs, function(fact) { return fact.periodId });
      periodRefs = lodash.uniq(periodRefs);
      if (debuglog.isEnabled) {
        debuglog(' - periodIds: %s', JSON.stringify(periodRefs, null, 2));
      }

      var query = periodModel.find({ _id: { $in: periodRefs }});
      return Promise.promisify(query.exec, {context: query})();
    }).then(function (periodRefs) {
      if (debuglog.isEnabled) {
        debuglog(' - period objects: %s', JSON.stringify(periodRefs, null, 2));
      }

      var periodMap = lodash.reduce(periodRefs, function(result, item) {
        result[item._id] = item;
        return result;
      }, {});

      lodash.forEach(ctx.facts, function(fact) {
        if (lodash.isEmpty(fact.periodName) || lodash.isEmpty(fact.periodSlug)) {
          fact.periodName = periodMap[fact.periodId].title;
          fact.periodSlug = periodMap[fact.periodId].slug;
        }
      });

      return ctx.facts;
    });
  };

  self.countFacts = function(criteria) {
    criteria = criteria || {};
    return Promise.promisify(factModel.count, {context: factModel})(criteria);
  };

  self.getFactDetails = function(factSlug) {
    var factDetails = {};
    return Promise.resolve().then(function() {
      return Promise.promisify(function(done) {
        factModel.findOne({ slug: factSlug }, done);
      })();
    }).then(function(fact) {
      if (debuglog.isEnabled) {
        debuglog(' - the fact with factSlug "%s" is: ', factSlug, JSON.stringify(fact));  
      }
      lodash.assign(factDetails, lodash.pick(fact, pickSchema(factModel, ['_id', '__v', 'events'])));
      if (lodash.isEmpty(fact) || !lodash.isArray(fact.events)) return [];
      return Promise.map(fact.events, Promise.promisify(function(eventId, index, length, done) {
        eventModel.findById(eventId, done);
      }));
    }).then(function(eventObjects) {
      if (debuglog.isEnabled) {
        debuglog(' - the events with factSlug "%s" are: ', factSlug, JSON.stringify(eventObjects));  
      }
      return lodash.assign(factDetails, {events: eventObjects});
    });
  };

  self.getFactTimeline = function(factSlug) {
    var timeline = {};
    return self.getFactDetails(factSlug).then(function(factDetails) {
      timeline.title = {
        media: {
          url: util.format('/filestore/picture/%s/%s/%s/%s.jpg',
            factDetails.picture,
            lodash.get(cfgResources, ['fact', 'thumbnail', 'frontend', 'formview', 'width'], 600),
            lodash.get(cfgResources, ['fact', 'thumbnail', 'frontend', 'formview', 'height'], 450),
            factDetails.slug)
        },
        text: {
          headline: factDetails.name,
          text: factDetails.description
        }
      };
      timeline.events = transformEventsToSlides(factDetails.events);

      return timeline;
    });
  };

  self.getFactById = function(id) {
    return Promise.promisify(factModel.findById, {context: factModel})(id);
  };

  self.createFact = function(jsondata) {
    var fact = new factModel(lodash.pick(jsondata, pickSchema(factModel, ['_id', '__v'])));
    return Promise.promisify(fact.save, {context: fact})();
  };

  self.updateFact = function(id, jsondata) {
    return Promise.promisify(factModel.update, {context: factModel})
      ({_id: id}, lodash.pick(jsondata, pickSchema(factModel, ['_id', '__v'])));
  };

  self.deleteFact = function(id) {
    return Promise.promisify(factModel.remove, {context: factModel})({_id: id});
  };

  self.getRandomFigures = function(count) {
    count = count || 0;
    if (debuglog.isEnabled) {
      debuglog(' - getRandomFigures(%s)', count);
    }
    return Promise.resolve().then(function() {
      return Promise.promisify(figureModel.count, {context: figureModel})();
    }).then(function(total) {
      return self.getFigures(count, getStartPosition(count, total), {}, {
        keepOriginalData: false
      });
    });
  };

  self.getFigures = function(count, start, criteria, options) {
    count = count || 0;
    start = start || 0;
    criteria = criteria || {};
    options = options || {};

    var ctx = {};

    var query = figureModel.find(criteria).skip(start).limit(count);
    if (options.keepOriginalData) {
      return Promise.promisify(query.exec, {context: query})();
    }

    return Promise.resolve().then(function() {
      return Promise.promisify(query.exec, {context: query})();
    }).then(function (figures) {
      ctx.figures = figures;

      var periodRefs = lodash.filter(figures, function(figure) { 
        return lodash.isEmpty(figure.periodName) || lodash.isEmpty(figure.periodSlug)
      });
      periodRefs = lodash.map(periodRefs, function(figure) { return figure.periodId });
      periodRefs = lodash.uniq(periodRefs);
      if (debuglog.isEnabled) {
        debuglog(' - periodIds: %s', JSON.stringify(periodRefs, null, 2));
      }

      var query = periodModel.find({ _id: { $in: periodRefs }});
      return Promise.promisify(query.exec, {context: query})();
    }).then(function (periodRefs) {
      if (debuglog.isEnabled) {
        debuglog(' - period objects: %s', JSON.stringify(periodRefs, null, 2));
      }

      var periodMap = lodash.reduce(periodRefs, function(result, item) {
        result[item._id] = item;
        return result;
      }, {});

      lodash.forEach(ctx.figures, function(figure) {
        if (lodash.isEmpty(figure.periodName) || lodash.isEmpty(figure.periodSlug)) {
          figure.periodName = periodMap[figure.periodId].title;
          figure.periodSlug = periodMap[figure.periodId].slug;
        }
      });

      return ctx.figures;
    });
  };

  self.countFigures = function(criteria) {
    criteria = criteria || {};
    return Promise.promisify(figureModel.count, {context: figureModel})(criteria);
  };

  self.getFigureDetails = function(figureSlug) {
    var figureDetails = {};
    return Promise.resolve().then(function() {
      return Promise.promisify(function(done) {
        figureModel.findOne({ slug: figureSlug }, done);
      })();
    }).then(function(figure) {
      if (debuglog.isEnabled) {
        debuglog(' - the figure with figureSlug "%s" is: ', figureSlug, JSON.stringify(figure));  
      }
      lodash.assign(figureDetails, lodash.pick(figure, pickSchema(figureModel, ['_id', '__v', 'events'])));
      if (lodash.isEmpty(figure) || !lodash.isArray(figure.events)) return [];
      return Promise.map(figure.events, Promise.promisify(function(eventId, index, length, done) {
        eventModel.findById(eventId, done);
      }));
    }).then(function(eventObjects) {
      if (debuglog.isEnabled) {
        debuglog(' - the events with figureSlug "%s" are: ', figureSlug, JSON.stringify(eventObjects));  
      }
      return lodash.assign(figureDetails, {events: eventObjects});
    });
  };

  self.getFigureTimeline = function(figureSlug) {
    var timeline = {};
    return self.getFigureDetails(figureSlug).then(function(figureDetails) {
      timeline.title = {
        media: {
          url: util.format('/filestore/picture/%s/%s/%s/%s.jpg',
            figureDetails.picture,
            lodash.get(cfgResources, ['figure', 'thumbnail', 'frontend', 'formview', 'width'], 600),
            lodash.get(cfgResources, ['figure', 'thumbnail', 'frontend', 'formview', 'height'], 450),
            figureDetails.slug)
        },
        text: {
          headline: figureDetails.name,
          text: figureDetails.description
        }
      };
      timeline.events = transformEventsToSlides(figureDetails.events);

      return timeline;
    });
  };

  self.getFigureById = function(id) {
    return Promise.promisify(figureModel.findById, {context: figureModel})(id);
  };

  self.createFigure = function(jsondata) {
    var figure = new figureModel(lodash.pick(jsondata, pickSchema(figureModel, ['_id', '__v'])));
    return Promise.promisify(figure.save, {context: figure})();
  };

  self.updateFigure = function(id, jsondata) {
    return Promise.promisify(figureModel.update, {context: figureModel})
      ({_id: id}, lodash.pick(jsondata, pickSchema(figureModel, ['_id', '__v'])));
  };

  self.deleteFigure = function(id) {
    return Promise.promisify(figureModel.remove, {context: figureModel})({_id: id});
  };

  var transformEventsToSlides = function(events) {
    events = events || [];
    return lodash.map(events, function(event) {
      var slide = {
        start_date: event.start_date || { year: 0 },
        text: {
          headline: event.headline,
          text: event.text
        },
        media: {}
      };
      
      if (lodash.isObject(event.end_date) && !lodash.isEmpty(event.end_date) && 
          event.start_date.year <= event.end_date.year) {
        slide.end_date = event.end_date;
      }

      if (lodash.isString(event.display_date) && !lodash.isEmpty(event.display_date)) {
        slide.display_date = event.display_date;
      }

      if (event.image) {
        slide.media.url = util.format('/filestore/picture/%s/%s/%s/%s.jpg',
            event.image,
            lodash.get(cfgResources, ['event', 'thumbnail', 'frontend', 'formview', 'width'], 600),
            lodash.get(cfgResources, ['event', 'thumbnail', 'frontend', 'formview', 'height'], 450),
            'figure.jpg');
      }

      return slide;
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
    "timelineMongooseWrapper": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;

var pickSchema = function (model, excluded) {
  var fields = [];
  model.schema.eachPath(function (path) {
    lodash.isArray(excluded) ? excluded.indexOf(path) < 0 ? fields.push(path) : false : path === excluded ? false : fields.push(path);
  });
  return fields;
};

var getStartPosition = function(count, total) {
  var max_start = (total - count) > 0 ? (total - count) : 0;
  var start = lodash.random(max_start);
  if (debuglog.isEnabled) {
    debuglog(' - the random starting position to get %s from %s items: %s', count, total, start);
  }
  return start;
};

var convertTextToDate = function(timeInText) {
  if (debuglog.isEnabled) {
    debuglog(' - before convertTextToDate("%s")', timeInText);
  }
  if (!timeInText || !lodash.isString(timeInText) || lodash.isEmpty(timeInText)) return {};
  var parts = timeInText.split(/[\-\.\_]/);
  var len = parts.length;
  var result = {};
  switch(len) {
    case 0: result = {}; break;
    case 1: result = {year: parts[0]}; break;
    case 2: result = {month: parts[0], year: parts[1]}; break;
    default: result = {day: parts[len - 3], month: parts[len - 2], year: parts[len - 1]};
  }
  if (debuglog.isEnabled) {
    debuglog(' - after convertTextToDate("%s") -> %s', timeInText, JSON.stringify(result));
  }
  return result;
};

var convertDateToText = function(timeInDate) {
  if (debuglog.isEnabled) {
    debuglog(' - before convertDateToText("%s")', JSON.stringify(timeInDate));
  }
  if (!lodash.isObject(timeInDate) || lodash.isEmpty(timeInDate)) return null;
  var buf = [];
  if (timeInDate.day) buf.push(timeInDate.day);
  if (timeInDate.month) buf.push(timeInDate.month);
  if (timeInDate.year) buf.push(timeInDate.year);
  var timeInText = buf.join('-');
  if (debuglog.isEnabled) {
    debuglog(' - after convertDateToText("%s") -> %s', JSON.stringify(timeInDate), timeInText);
  }
  return timeInText;
};
