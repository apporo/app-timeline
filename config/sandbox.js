module.exports = {
  bridges: {
    timelineMongodbWrapper: {
      mongodb: {
        connection_options: {
          host: '127.0.0.1',
          port: '27017',
          name: 'timeline'
        },
        cols: {
          TOPIC: 'topic',
          EVENT: 'event',
          TOPIC_EVENT: 'topic_event'
        }
      }
    }
  },
  plugins: {
    appTimeline: {
      contextPath: '/timeline'
    }
  }
};
