document.body.innerHTML +=
    '<button style="position: absolute top: 5px right: 5px" onclick="pywebview.api.restart()">Restart</button>'
const jsConfetti = new JSConfetti()

var audio = new Audio("/yay.wav")
audio.play()

let executionCount = 0

const intervalId = setInterval(() => {
    jsConfetti.addConfetti({
        confettiRadius: 6,
        confettiNumber: 20,
    })

    executionCount++

    if (executionCount >= 15) {
        clearInterval(intervalId)
    }
}, 50)

pywebview.api
    .music()
    .then((state) => {
        if (state) {
            setTimeout(() => {
                const audio = new Audio("/ost1.wav")
                audio.play().catch((error) => {
                    console.error("Error playing audio:", error)
                })
            }, 50)
        }
    })
    .catch((error) => {
        console.error("Error fetching music state:", error)
    })
