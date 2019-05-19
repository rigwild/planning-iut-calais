'use strict'

const favoriteKey = 'favorite-class'

new Vue({ /* eslint-disable-line */
  el: '#app',
  data() {
    return {
      classes: [],
      fields: [
        { key: 'class', label: 'Class', sortable: true, sortDirection: 'asc' },
        { key: 'show', label: 'Show', class: 'text-center' },
        { key: 'favorite', label: 'Fav', class: 'text-center' },
        { key: 'link', label: 'Link', class: 'text-center' }
      ],
      sortBy: null,
      sortDesc: false,
      sortDirection: 'asc',
      filter: null,

      favoriteClassId: null,
      visibleClassId: null,
      visibleWeek: 1,
      showClasses: true
    }
  },

  computed: {
    getFavoriteId() {
      if (!this.favoriteClassId) this.favoriteClassId = localStorage.getItem(favoriteKey)
      return this.favoriteClassId
    },
    getFavoriteObj() {
      if (!this.getFavoriteId) return
      return this.classes.find(x => x.id === this.getFavoriteId)
    },

    getVisibleClassObj() {
      if (!this.visibleClassId) return
      return this.classes.find(x => x.id === this.visibleClassId)
    },
    getVisibleScreenshot() {
      const visible = this.getVisibleClassObj
      if (!visible) return
      let obj = { ...visible, ...visible.weeks[this.visibleWeek] }
      delete obj.weeks
      return obj
    }
  },

  async mounted() {
    await this.getData()
    // A favorite class was in cache, show it
    if (this.getFavoriteId) {
      this.showClasses = false
      this.showScreenshot(this.getFavoriteObj)
    }
  },

  methods: {
    getFavoriteIcon(bool) {
      return bool ? '💖' : '🖤'
    },
    getShownIcon(bool) {
      return bool ? '👀' : '👁'
    },
    getWeekText(weekInt) {
      if (weekInt < 1 || weekInt > 4) return
      return ['Current week', 'One week from now', 'Two weeks from now', 'Three weeks from now'][weekInt - 1]
    },

    cropText(text, limit = 23) {
      return text.length > limit ? `${text.slice(0, limit).trim()}...` : text
    },
    // Convert a date object to a human-readable date
    toReadableDate(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    // Get the list of classes from API
    async getData() {
      const { classes } = await fetch('/classes').then(res => res.json())
      this.classes = Object.keys(classes).map(id => {
        classes[id].favorite = this.getFavoriteId === id
        classes[id].id = id
        return classes[id]
      })
    },

    // Show a screenshot
    showScreenshot(classObj) {
      if (!classObj) return
      this.visibleClassId = classObj.id
    },
    // Set a class as being the favorite one
    setFavorite(classId) {
      const classIndex = this.classes.findIndex(x => x.id === classId)
      if (classIndex === -1) throw new Error('Could not set favorite class.')

      // If already favorite reset it, else set favorite
      if (this.classes[classIndex].favorite) {
        this.classes[classIndex].favorite = false
        localStorage.removeItem(favoriteKey)
        this.favoriteClassId = null
      }
      else {
        this.classes.forEach(x => (x.favorite = false))
        this.classes[classIndex].favorite = true
        localStorage.setItem(favoriteKey, classId)
        this.favoriteClassId = classId
      }
    },
    // Set favorite class row color
    rowClass(item, _type) {
      if (!item) return
      if (item.favorite) return 'table-warning'
    }
  }
})

Vue.config.devtools = true /* eslint-disable-line */
