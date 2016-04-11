'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('timeline:controller');

var Connection = require('../models/connection.js');
var PeriodModel = require('../models/period-model.js');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);

  var cfgTimeline = lodash.get(params, ['sandboxConfig', 'plugins', 'appTimeline'], {});
  var contextPath = lodash.get(cfgTimeline, ['contextPath'], '/timeline');
  var menuSubItemCount = lodash.get(cfgTimeline, ['menuSubItemCount'], {});
  var resourceSlugs = lodash.get(cfgTimeline, ['resourceSlugs'], {});
  var getSlugs = function(resourceName) {
    return resourceSlugs[resourceName] ? resourceSlugs[resourceName] : resourceName;
  };

  var connection = Connection({ mongoURI: 'mongodb://127.0.0.1/suviet_demo'});
  var periodModel = PeriodModel(connection);  

  var self = this;
  var webserverTrigger = params.webserverTrigger;
  var express = webserverTrigger.getExpress();

  self.buildPageRouter = function() {
    var router = express.Router();
    
    router.route('/*').get(function(req, res, next) {
      var navigation = {};
      Promise.all([
        params.timelineHelper.getRandomPeriods(menuSubItemCount['period'] || 4),
        params.timelineHelper.getRandomFacts(menuSubItemCount['fact'] || 5),
        params.timelineHelper.getRandomFigures(menuSubItemCount['figure'] || 12)
      ]).spread(function(periods, facts, figures) {
        navigation = {periods: periods, facts: facts, figures: figures};
      }).finally(function() {
        res.locals.navigation = navigation;
        next();
      });
    });

    router.route(util.format('/%s', getSlugs('periods'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getPeriods();
      }).then(function(periods) {
        res.render('pages/periods', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          periods: periods
        });
      });
    });

    router.route(util.format('/%s/:periodSlug', getSlugs('period'))).get(function(req, res, next) {
      var periodSlug = req.params.periodSlug;
      if (debuglog.isEnabled) {
        debuglog(' - /%s/:periodSlug is request, period slug: %s', getSlugs('period'), periodSlug);
      }
      Promise.resolve().then(function() {
        return params.timelineHelper.getPeriodDetails(periodSlug);
      }).then(function(periodDetails) {
        res.render('pages/period-details', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          period: periodDetails
        });
      });
    });

    router.route(util.format('/%s', getSlugs('facts'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getFacts();
      }).then(function(facts) {
        res.render('pages/facts', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          facts: facts
        });
      });
    });

    router.route(util.format('/%s/:factSlug', getSlugs('fact'))).get(function(req, res, next) {
      var factSlug = req.params.factSlug;
      if (debuglog.isEnabled) {
        debuglog(' - /%s/:factSlug is request, fact slug: %s', getSlugs('fact'), factSlug);
      }
      Promise.resolve().then(function() {
        return params.timelineHelper.getFactDetails(factSlug);
      }).then(function(factDetails) {
        res.render('pages/fact-details', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          fact: factDetails
        }, function(err, html) {
          res.send(html); // res.write(html);
        });
      }).catch(function(err) {
        debuglog(' - Error on getting events by fact: %s', err);
        res.status(404);
        res.render('pages/error', {
          contextPath: contextPath
        });
      });
    });
    
    router.route(util.format('/%s', getSlugs('figures'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getFigures();
      }).then(function(figures) {
        res.render('pages/figures', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          figures: figures
        });
      });
    });

    router.route(util.format('/%s/:figureSlug', getSlugs('figure'))).get(function(req, res, next) {
      var figureSlug = req.params.figureSlug;
      if (debuglog.isEnabled) {
        debuglog(' - /%s/:figureSlug is request, figure slug: %s', getSlugs('figure'), figureSlug);
      }
      Promise.resolve().then(function() {
        return params.timelineHelper.getFigureDetails(figureSlug);
      }).then(function(figureDetails) {
        res.render('pages/figure-details', {
          contextPath: contextPath,
          resourceSlugs: resourceSlugs,
          figure: figureDetails
        }, function(err, html) {
          res.send(html); // res.write(html);
        });
      }).catch(function(err) {
        debuglog(' - Error on getting events by figure: %s', err);
        res.status(404);
        res.render('pages/error', {
          contextPath: contextPath
        });
      });
    });

    return router;
  };

  self.buildRestRouter = function() {
    var router = express.Router();

    router.route('/periods')
      .get(function(req, res, next) {
        periodModel.find({}, function(err, periods) {
          if (err) res.send(err);
          res.json(periods);
        });
      })
      .post(function(req, res, next) {
        var period = new periodModel(lodash.pick(req.body, pickSchema(periodModel, ['_id', '__v'])));
        period.save(function(err) {
          if (err) res.send(err);
          res.json({ message: 'New beer drinker added to the locker room!' });
        });
      });

    router.route('/periods/:id')
      .get(function(req, res, next) {
        periodModel.findById(req.params.id, function(err, period) {
          if (err) res.send(err);
          res.json(period);
        })
      })
      .put(function(req, res, next) {
        periodModel.update({
          _id: req.params.id
        }, 
        lodash.pick(req.body, pickSchema(periodModel, ['_id', '__v'])),
        function(err, num, raw) {
          if (err) res.send(err);
          res.json({ message: num + ' updated' });
        });
      })
      .delete(function(req, res, next) {
        periodModel.remove({ _id: req.params.id }, function(err) {
          if (err) res.send(err);
          res.json({ message: 'Beer removed from the locker!' });
        });
      });

    return router;
  }

  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "timelineController",
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

var pickSchema = function (model, excluded) {
  var fields = [];
  model.schema.eachPath(function (path) {
    lodash.isArray(excluded) ? excluded.indexOf(path) < 0 ? fields.push(path) : false : path === excluded ? false : fields.push(path);
  });
  return fields;
};
