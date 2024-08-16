function loadwinnerscreen() {
    document.body.innerHTML = ""
    const body = document.body

    var label = document.createElement("h1")
    label.id = "suwigaiow"
    label.innerText = "The winners are being displayed!"
    label.style.display = "inline-block"
    label.style.fontSize = "36px"
    label.style.animation = "rotate 3s infinite ease-in-out"

    const style = document.createElement("style")
    style.textContent = `
            @keyframes rotate {
                0% {
                    transform: rotate(-5deg)
                }
                50% {
                    transform: rotate(5deg)
                }
                100% {
                    transform: rotate(-5deg)
                }
            }
        `
    document.head.appendChild(style)

    body.appendChild(label)

    return label
}
