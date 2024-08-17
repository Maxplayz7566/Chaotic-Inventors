function isPortrait() {
    // Create a MediaQueryList object with the 'orientation: portrait' media query
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    
    // Return true if the query matches (i.e., the device is in portrait mode)
    return portraitQuery.matches
}

function loadwaitpage(who) {
    document.body.innerHTML = ""
    const body = document.body
    
    
    var label = document.createElement("h1")
    label.id = "suwigaiow"
    label.innerText = `${who}'s presenting, look at the screen!`
    label.style.display = 'inline-block'
    label.style.fontSize = '36px'
    label.style.animation = 'rotate 3s infinite ease-in-out'
    
    const style = document.createElement('style')
    style.textContent = `
        @keyframes rotate {
            0% {
                transform: rotate(-5deg);
            }
            50% {
                transform: rotate(5deg);
            }
            100% {
                transform: rotate(-5deg);
            }
        }
    `
    document.head.appendChild(style)
    
    body.appendChild(label)

    body.innerHTML += `<div id="reations" style="justify-content: center; display: flex; flex-wrap: wrap; gap: 15px; bottom: 2%; position: absolute;">
        <button class="reaction" onclick="react('🔥')">🔥</button>
        <button class="reaction" onclick="react('💀')">💀</button>
        <button class="reaction" onclick="react('💩')">💩</button>
        
    </div>`
    
    return label
}