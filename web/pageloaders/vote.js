function loadvotepage(username) {
    document.body.innerHTML = ""
    const body = document.body


    var label = document.createElement("h1")
    label.id = "suwigaiow"
    label.innerText = `Rate ${username}'s drawing`
    label.style.display = 'inline-block'
    label.style.top = "5px"
    label.style.position = "absolute"
    label.style.fontSize = '24px'
    label.style.animation = 'rotate 3s infinite ease-in-out'

    var voteOptionContainer = document.createElement("div")
    voteOptionContainer.style.display = "flex"
    voteOptionContainer.style.flexWrap = "wrap"
    voteOptionContainer.style.justifyContent = 'center'
    voteOptionContainer.style.maxWidth = "95%"
    voteOptionContainer.style.gap = "15px"

    function handleVoteClick(buttons, index) {
        return function() {
            socket.emit("vote-status", index + 1)
            console.log(index + 1)
            buttons.forEach(button => {
                button.className = "disabled"
                button.onclick = null
                button.style.cursor = "default"
                button.disabled = true
            })
        }
    }

    // Create an array to store the button elements
    const voteButtons = []

    // Loop to create 5 buttons
    for (let i = 0 i < 4 i++) {
        const voteButton = document.createElement("button")
        voteButton.innerText = (i + 1).toString()
        voteButton.className = "VoteOption"
        voteButton.onclick = handleVoteClick(voteButtons, i)
        voteButtons.push(voteButton)
        voteOptionContainer.appendChild(voteButton)
    }

    const style = document.createElement('style')
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
    body.appendChild(voteOptionContainer)

    return label
}