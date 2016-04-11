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
          PERIOD: 'period',
          EVENT: 'event',
          FACT: 'topic',
          FACT_EVENT: 'topic_event',
          FIGURE: 'figure',
          FIGURE_EVENT: 'figure_event'
        }
      }
    }
  },
  plugins: {
    appTimeline: {
      contextPath: '/timeline',
      resourceSlugs: {
        periods: 'thoi-ky-lich-su',
        period: 'thoi-ky',
        facts: 'su-kien-lich-su',
        fact: 'su-kien',
        figures: 'nhan-vat-lich-su',
        figure: 'nhan-vat'
      }
    }
  }
};
