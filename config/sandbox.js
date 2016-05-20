module.exports = {
  bridges: {
    timelineMongooseWrapper: {
      mongoose: {
        connection_options: {
          host: '127.0.0.1',
          port: '27017',
          name: 'timeline'
        }
      }
    }
  },
  plugins: {
    appTimeline: {
      contextPath: '/timeline',
      paginationEnabled: true,
      resources: {
        period: {
          slug: {
            listpage: 'periods',
            itempage: 'period'
          },
          thumbnail: {
            frontend: {
              menuitem: {
                width: 400,
                height: 300
              },
              listview: {
                width: 200,
                height: 150
              },
              formview: {
                width: 600,
                height: 450
              }
            }
          },
          menuSubItemCount: 4,
          slideshowItemCount: 0
        },
        event: {
          thumbnail: {
            frontend: {
              listitem: {
                width: 253,
                height: 170
              },
              formview: {
                width: 600,
                height: 450
              }
            }
          }
        },
        fact: {
          slug: {
            listpage: 'facts',
            itempage: 'fact'
          },
          thumbnail: {
            frontend: {
              listitem: {
                width: 253,
                height: 170
              },
              formview: {
                width: 600,
                height: 450
              }
            }
          },
          menuSubItemCount: 6,
          slideshowItemCount: 8,
          itemsPerPage: 8
        },
        figure: {
          slug: {
            listpage: 'figures',
            itempage: 'figure'
          },
          thumbnail: {
            frontend: {
              listitem: {
                width: 253,
                height: 170
              },
              formview: {
                width: 600,
                height: 450
              }
            }
          },
          menuSubItemCount: 12,
          slideshowItemCount: 8,
          itemsPerPage: 8
        },
        otherinfo: {
          slug: 'otherinfo'
        }
      }
    }
  }
};
