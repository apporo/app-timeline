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
      resourceSlugs: {
        periods: 'thoi-ky-lich-su',
        period: 'thoi-ky',
        facts: 'su-kien-lich-su',
        fact: 'su-kien',
        figures: 'nhan-vat-lich-su',
        figure: 'nhan-vat',
        disclaimer: 'phu-nhan-chung',
        aboutus: 've-chung-toi'
      },
      resources: {
        periods: {
          slug: 'thoi-ky-lich-su'
        },
        period: {
          slug: 'thoi-ky',
          thumbnail: {
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
          },
          menuSubItemCount: 4
        },
        facts: {
          slug: 'su-kien-lich-su'
        },
        fact: {
          slug: 'su-kien'
        },
        figures: {
          slug: 'nhan-vat-lich-su'
        },
        figure: {
          slug: 'nhan-vat'
        }
      }
    }
  }
};
