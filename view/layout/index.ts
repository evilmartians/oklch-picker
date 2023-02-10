import { showPlot3d } from "../../stores/settings.js"

showPlot3d.subscribe(show => {
  document.body.classList.toggle('is-plot3d-hidden', !show)
})
