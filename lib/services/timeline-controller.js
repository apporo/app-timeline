'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('timeline:controller');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);

  var cfgTimeline = lodash.get(params, ['sandboxConfig', 'plugins', 'appTimeline'], {});
  var contextPath = lodash.get(cfgTimeline, ['contextPath'], '/timeline');
  var menuSubItemCount = lodash.get(cfgTimeline, ['menuSubItemCount'], {});
  var cfgResources = lodash.get(cfgTimeline, ['resources'], {});
  var resourceSlugs = lodash.get(cfgTimeline, ['resourceSlugs'], {});
  var getSlugs = function(resourceName) {
    return resourceSlugs[resourceName] ? resourceSlugs[resourceName] : resourceName;
  };

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
        res.locals.req = req;
        next();
      });
    });

    router.route(util.format('/%s', getSlugs('periods'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getPeriods();
      }).then(function(periods) {
        res.render('pages/periods', {
          contextPath: contextPath,
          resources: cfgResources,
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
      var box = {};
      Promise.resolve().then(function() {
        return params.timelineHelper.getPeriodDetails(periodSlug);
      }).then(function(periodDetails) {
        res.render('pages/period-details', {
          contextPath: contextPath,
          resources: cfgResources,
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
          resources: cfgResources,
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
        res.render('pages/fact-timeline', {
          contextPath: contextPath,
          resources: cfgResources,
          resourceSlugs: resourceSlugs,
          fact: factDetails
        }, function(err, html) {
          res.send(html); // res.write(html);
        });
      }).catch(function(err) {
        debuglog(' - Error on getting events by fact: %s', err);
        res.status(404);
        res.render('pages/error', {
          contextPath: contextPath,
          resources: cfgResources
        });
      });
    });
    
    router.route(util.format('/%s', getSlugs('figures'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getFigures();
      }).then(function(figures) {
        res.render('pages/figures', {
          contextPath: contextPath,
          resources: cfgResources,
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
        res.render('pages/figure-timeline', {
          contextPath: contextPath,
          resources: cfgResources,
          resourceSlugs: resourceSlugs,
          figure: figureDetails
        }, function(err, html) {
          res.send(html); // res.write(html);
        });
      }).catch(function(err) {
        debuglog(' - Error on getting events by figure: %s', err);
        res.status(404);
        res.render('pages/error', {
          contextPath: contextPath,
          resources: cfgResources
        });
      });
    });

    router.route(util.format('/%s', getSlugs('disclaimer'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return params.timelineHelper.getDisclaimer();
      }).then(function(ctx) {
        ctx = ctx || { disclaimer: {} };
        res.render('pages/disclaimer', {
          contextPath: contextPath,
          resources: cfgResources,
          resourceSlugs: resourceSlugs,
          data: { disclaimer: ctx.disclaimer || {} }
        });
      });
    });

    router.route(util.format('/%s', getSlugs('aboutus'))).get(function(req, res, next) {
      Promise.resolve().then(function() {
        return {};
      }).then(function(ctx) {
        res.render('pages/aboutus', {
          contextPath: contextPath,
          resources: cfgResources,
          resourceSlugs: resourceSlugs,
          data: { aboutus: ctx }
        });
      });
    });

    router.route('/').get(function(req, res, next) {
      Promise.resolve().then(function() {
        return {};
      }).then(function(ctx) {
        res.render('pages/homepage', {
          contextPath: contextPath,
          resources: cfgResources,
          resourceSlugs: resourceSlugs,
          data: { homepage: ctx }
        });
      });
    });

    return router;
  };

  self.buildRestRouter = function() {
    var router = express.Router();

    router.route('/periods')
      .get(function(req, res, next) {
        var opts = queryParser(req);
        var start = opts.range[0];
        var count = opts.range[1];
        var criteria = {};
        if (!lodash.isEmpty(opts.filter) && !lodash.isEmpty(opts.filter.q)) {
          criteria.title = new RegExp(opts.filter.q, 'i');
        }
        var sorting = opts.sort;
        var options = {};
        params.timelineHelper.getPeriods(count, start, criteria, sorting, options).then(function(periods) {
          res.json(periods);
        }, function(err) {
          res.send(err);
        });
      })
      .post(function(req, res, next) {
        params.timelineHelper.createPeriod(req.body).then(function(savedObject) {
          if (debuglog.isEnabled) {
            debuglog('A new %s has been created. Result: ', 'Period', JSON.stringify(savedObject));
          }
          res.json(savedObject);
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/periods/:id')
      .get(function(req, res, next) {
        params.timelineHelper.getPeriodById(req.params.id).then(function(period) {
          res.json(period);
        }, function(err) {
          res.send(err);
        });
      })
      .put(function(req, res, next) {
        params.timelineHelper.updatePeriod(req.params.id, req.body).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been updated. Result: ', 'Period', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been updated. count: %s', 'Period', 
              req.params.id, info.nModified || -1)});
        }, function(err) {
          res.send(err);
        });
      })
      .delete(function(req, res, next) {
        params.timelineHelper.deletePeriod(req.params.id).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been removed. Result: ', 'Period', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been removed', 'Period', req.params.id)});
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/events')
      .get(function(req, res, next) {
        var opts = queryParser(req);
        var start = opts.range[0];
        var count = opts.range[1];
        var criteria = {};
        if (!lodash.isEmpty(opts.filter) && !lodash.isEmpty(opts.filter.q)) {
          criteria.headline = new RegExp(opts.filter.q, 'i');
        }
        var options = {};
        params.timelineHelper.getEvents(count, start, criteria, options).then(function(records) {
          res.json(records);
        }, function(err) {
          res.send(err);
        });
      })
      .post(function(req, res, next) {
        params.timelineHelper.createEvent(req.body).then(function(savedObject) {
          if (debuglog.isEnabled) {
            debuglog('A new %s has been created. Result: ', 'Event', JSON.stringify(savedObject));
          }
          res.json(savedObject);
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/events/:id')
      .get(function(req, res, next) {
        params.timelineHelper.getEventById(req.params.id).then(function(event) {
          res.json(event);
        }, function(err) {
          res.send(err);
        });
      })
      .put(function(req, res, next) {
        params.timelineHelper.updateEvent(req.params.id, req.body).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been updated. Result: ', 'Event', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been updated. count: %s', 'Event', 
              req.params.id, info.nModified || -1)});
        }, function(err) {
          res.send(err);
        });
      })
      .delete(function(req, res, next) {
        params.timelineHelper.deleteEvent(req.params.id).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been removed. Result: ', 'Event', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been removed', 'Event', req.params.id)});
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/facts')
      .get(function(req, res, next) {
        var opts = queryParser(req);
        var start = opts.range[0];
        var count = opts.range[1];
        var criteria = {};
        if (!lodash.isEmpty(opts.filter)) {
          if (!lodash.isEmpty(opts.filter.periodId)) {
            criteria.periodId = new RegExp(opts.filter.periodId, 'i');  
          }
          if (!lodash.isEmpty(opts.filter.name)) {
            criteria.name = new RegExp(opts.filter.name, 'i');  
          }
        }
        var options = {
          keepOriginalData: true
        };
        params.timelineHelper.getFacts(count, start, criteria, options).then(function(facts) {
          res.json(facts);
        }, function(err) {
          res.send(err);
        });
      })
      .post(function(req, res, next) {
        params.timelineHelper.createFact(req.body).then(function(savedObject) {
          if (debuglog.isEnabled) {
            debuglog('A new %s has been created. Result: ', 'Fact', JSON.stringify(savedObject));
          }
          res.json(savedObject);
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/facts/:id')
      .get(function(req, res, next) {
        params.timelineHelper.getFactById(req.params.id).then(function(fact) {
          res.json(fact);
        }, function(err) {
          res.send(err);
        });
      })
      .put(function(req, res, next) {
        params.timelineHelper.updateFact(req.params.id, req.body).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been updated. Result: ', 'Fact', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been updated. count: %s', 'Fact', 
              req.params.id, info.nModified || -1)});
        }, function(err) {
          res.send(err);
        });
      })
      .delete(function(req, res, next) {
        params.timelineHelper.deleteFact(req.params.id).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been removed. Result: ', 'Fact', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been removed', 'Fact', req.params.id)});
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/figures')
      .get(function(req, res, next) {
        var opts = queryParser(req);
        var start = opts.range[0];
        var count = opts.range[1];
        var criteria = {};
        if (!lodash.isEmpty(opts.filter)) {
          if (!lodash.isEmpty(opts.filter.periodId)) {
            criteria.periodId = new RegExp(opts.filter.periodId, 'i');  
          }
          if (!lodash.isEmpty(opts.filter.name)) {
            criteria.name = new RegExp(opts.filter.name, 'i');  
          }
        }
        var options = {
          keepOriginalData: true
        };
        params.timelineHelper.getFigures(count, start, criteria, options).then(function(figures) {
          res.json(figures);
        }, function(err) {
          res.send(err);
        });
      })
      .post(function(req, res, next) {
        params.timelineHelper.createFigure(req.body).then(function(savedObject) {
          if (debuglog.isEnabled) {
            debuglog('A new %s has been created. Result: ', 'Figure', JSON.stringify(savedObject));
          }
          res.json(savedObject);
        }, function(err) {
          res.send(err);
        });
      });

    router.route('/figures/:id')
      .get(function(req, res, next) {
        params.timelineHelper.getFigureById(req.params.id).then(function(figure) {
          res.json(figure);
        }, function(err) {
          res.send(err);
        });
      })
      .put(function(req, res, next) {
        params.timelineHelper.updateFigure(req.params.id, req.body).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been updated. Result: ', 'Figure', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been updated. count: %s', 'Figure', 
              req.params.id, info.nModified || -1)});
        }, function(err) {
          res.send(err);
        });
      })
      .delete(function(req, res, next) {
        params.timelineHelper.deleteFigure(req.params.id).then(function(info) {
          if (debuglog.isEnabled) {
            debuglog('%s#%s has been removed. Result: ', 'Figure', req.params.id, JSON.stringify(info));
          }
          res.json({ message: util.format('%s#%s has been removed', 'Figure', req.params.id)});
        }, function(err) {
          res.send(err);
        });
      });

    return router;
  }

  self.buildDataRouter = function() {
    var router = express.Router();

    router.route('/fact/:slug/timeline.json')
      .get(function(req, res, next) {
        params.timelineHelper.getFactTimeline(req.params.slug).then(function(factTimeline) {
          res.json(factTimeline);
        });
      });

    router.route('/figure/:slug/timeline.json')
      .get(function(req, res, next) {
        params.timelineHelper.getFigureTimeline(req.params.slug).then(function(figureTimeline) {
          res.json(figureTimeline);
        });
      });

    return router;
  };

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

var queryParser = function(req) {
  var options = {};

  ['filter', 'range', 'sort'].forEach(function (attr) {
    if (!lodash.isEmpty(req.query[attr])) {
      try {
        options[attr] = JSON.parse(req.query[attr]);
      } catch (err) {
        if (debuglog.isEnabled) {
          debuglog(' - error on parsing req query [%s]: %s', attr, err);
        }
      }
    }
  });

  if (!lodash.isArray(options.range) || options.range.length < 2) {
    options.range = [0, -1];
  }

  options.range[1] = 1 + options.range[1];

  if (lodash.isArray(options.sort) && options.sort.length == 2) {
    var sortObj = {};
    sortObj[options.sort[0]] = new String(options.sort[1]).toLowerCase();
    options.sort = sortObj;
  }

  debuglog(' - query options: %s', JSON.stringify(options));

  return options;
};
