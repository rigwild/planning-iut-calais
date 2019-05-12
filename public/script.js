'use strict'

new Vue({ /* eslint-disable-line */
  el: '#app',
  data() {
    return {
      classes: [],
      fields: [
        { key: 'class', label: 'Class', sortable: true, sortDirection: 'asc' },
        { key: 'action', label: 'Actions', class: 'text-center' }
      ],
      sortBy: null,
      sortDesc: false,
      sortDirection: 'asc',
      filter: null,

      visibleScreenshot: null,
      showClasses: true
    }
  },
  async mounted() {
    await this.getData()
  },
  methods: {
    favorite(bool) {
      return bool ? '💖' : '🖤'
    },
    async getData() {
      const { classes } = await fetch('/classes').then(res => res.json())
      this.classes = Object.keys(classes).map(x => {
        classes[x].default = false
        classes[x].id = x
        return classes[x]
      })
    },

    showScreenshot(screenshotObj) {
      const screenshot = screenshotObj.screenPath
      this.visibleScreenshot = screenshot
    },
    setDefault(classId) {
      const classIndex = this.classes.findIndex(x => x.id === classId)
      if (classIndex === -1) throw new Error('Could not set default class.')

      // If already default reset it, else set default
      if (this.classes[classIndex].default)
        this.classes[classIndex].default = false
      else {
        this.classes.forEach(x => (x.default = false))
        this.classes[classIndex].default = true
      }
    },

    // Set default class row color
    rowClass(item, _type) {
      if (!item) return
      if (item.default) return 'table-warning'
    }
  }
})

Vue.config.devtools = true /* eslint-disable-line */
