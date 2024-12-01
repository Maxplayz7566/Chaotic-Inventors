var socket = io(window.location.hostname + `:${location.port}`, {
    autoConnect: false
})

var problem = ""
let runCount = 0 // Initialize the counter

addEventListener("DOMContentLoaded", (event) => {
    let wakeLock = null

    // Function to request a wake lock
    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request("screen")
            wakeLock.addEventListener("release", () => {
                console.log("Wake Lock was released")
            })
            console.log("Wake Lock is active")
        } catch (err) {
            console.error(`${err.name}, ${err.message}`)
        }
    }

    // Request a wake lock when the page is loaded
    requestWakeLock()

    // Optionally, you can also handle visibility change events
    document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
            await requestWakeLock()
        } else {
            wakeLock = null
        }
    })
})

function logName() {
    // Get the input value
    const input = document.getElementById("nameInput")
    const name = input.value.trim()

    // Validate the input
    if (name.length != 0) {
        input.disabled = true
        document.getElementById("selectbutton").disabled = true
        document.getElementById("selectbutton").style.cursor = "default"
        document.getElementById("selectbutton").className = "disabled"
        console.log(name)
        prepareWebsocket(name)
    }
}

function prepareWebsocket(name) {
    socket.connect(":5000")
    socket.emit("set_user_name", name)
    document.body.innerHTML = "<h1>Please wait...</h1>"
    window.addEventListener("beforeunload", () => {
        socket.close()
    })
}

socket.on("connect", () => {
    document.body.innerHTML = ""

    document.body.innerHTML += `<div id="reations" style="justify-content: center max-width: 90%">
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('👍')">👍</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🔥')">🔥</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('💀')">💀</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🐢')">🐢</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😊')">😊</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😂')">😂</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😎')">😎</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🎉')">🎉</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🎂')">🎂</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🚀')">🚀</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🌟')">🌟</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😢')">😢</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🤔')">🤔</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🥳')">🥳</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😴')">😴</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🤯')">🤯</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('😜')">😜</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🤗')">🤗</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('💥')">💥</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🎶')">🎶</button>
        <button style="background-color: rbga(0,0,0,0)" class="reaction" onclick="react('🚨')">🚨</button>
    </div>`

    const reactions = document.getElementById("reations")

    reactions.style.display = "flex"
    reactions.style.flexWrap = "wrap"
    reactions.style.justifyContent = "center"
    reactions.style.gap = "15px"
})

socket.on("disconnect", () => {
    window.location.href = 'https://chaoticinventors.vercel.app/'
})

socket.on("remove-client", (data) => {
    if (data == socket.id) {
        window.location.href = 'https://chaoticinventors.vercel.app/'
    }
})

socket.on("alive-check", (data) => {
    socket.emit("alive-check", "asd")
})

function react(text) {
    console.log(text)
    socket.emit("reaction", text)
}

socket.on("game-start-event", (data) => {
    var label = getproblem()

    socket.on("problem-handout", (data) => {
        const decoder = new TextDecoder()
        data = decoder.decode(data)
        console.log(data)
        runCount++ // Increment the counter each time the function is called
        if (runCount === 2) {
            problem = data
        }
        ranOnce = true        
        label.innerText = data
    })

    socket.on("drawing-time", (data) => {
        document.body.innerHTML = ""
        if (data) {
            enableDrawing()
        } else {
            disableDrawing()
        }
    })

    socket.on("voting-time", (data) => {
        console.log(data)
        document.body.innerHTML = ""
        loadvotepage(data)
    })

    socket.on("waiting-time", (data) => {
        console.log(data)
        document.body.innerHTML = ""
        loadwaitpage(data)
    })

    socket.on("presenting-time", (data) => {
        document.body.innerHTML = ""
        loadpresentpage()
    })

    socket.on("winners-time", (data) => {
        document.body.innerHTML = ""
        loadwinnerscreen()
    })
})

function setViewportZoom(level) {
    // Ensure the zoom level is a valid value
    if (level > 0 && level <= 1) {
        var viewportMeta = document.querySelector('meta[name="viewport"]')
        if (viewportMeta) {
            viewportMeta.setAttribute(
                "content",
                "width=device-width, initial-scale=" + level
            )
        } else {
            viewportMeta = document.createElement("meta")
            viewportMeta.name = "viewport"
            viewportMeta.content = "width=device-width, initial-scale=" + level
            document.head.appendChild(viewportMeta)
        }
    } else {
        console.error(
            "Invalid zoom level. Please provide a value between 0 and 1."
        )
    }
}
