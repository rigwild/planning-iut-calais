'use strict'

new Vue({ /* eslint-disable-line */
  el: '#app',
  data() {
    return {
      screenshots: {}
    }
  },

  async mounted() {
    await this.getData()
  },

  methods: {
    async getData() {
      const data = await fetch('/screenshotsData').then(res => res.json())
      this.screenshots = data
      console.log(data)
    }
  }
})

Vue.config.devtools = true /* eslint-disable-line */
