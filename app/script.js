document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "r") {
        event.preventDefault()

        window.location.reload()
    }

    if (event.key === "F11") {
        event.preventDefault()
        pywebview.api.fullscreen()
    }
})