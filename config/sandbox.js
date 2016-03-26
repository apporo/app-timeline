module.exports = {
  bridges: {
    timelineMongodbWrapper: {
      mongodb: {
        connection_options: {
          host: '127.0.0.1',
          port: '27017',
          name: 'suviet_unknown'
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
