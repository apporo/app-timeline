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
        periods: {
          slug: 'thoi-ky-lich-su',
          menuSubItemCount: 4
        },
        period: {
          slug: 'thoi-ky',
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
          }
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
        facts: {
          slug: 'su-kien-lich-su',
          menuSubItemCount: 6,
          itemsPerPage: 8
        },
        fact: {
          slug: 'su-kien',
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
        figures: {
          slug: 'nhan-vat-lich-su',
          menuSubItemCount: 12,
          itemsPerPage: 8
        },
        figure: {
          slug: 'nhan-vat',
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
        disclaimer: {
          slug: 'phu-nhan-chung'
        },
        aboutus: {
          slug: 've-chung-toi'
        }
      }
    }
  }
};
