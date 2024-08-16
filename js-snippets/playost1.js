function playOST1(duration) {
    var audioUrl = "";

    fetch("http://localhost:5000/ost?num=1")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.blob(); // Use blob() to handle binary data
        })
        .then((blob) => {
            audioUrl = URL.createObjectURL(blob); // Create a URL for the Blob
        })
        .catch((error) => {
            console.error(
                "There was a problem with the fetch operation:",
                error
            );
        });

    var audio = new Audio("/ost1.wav");
    audio.play().catch(function (error) {
        console.log("Error playing audio:", error);
    });

    var delay = duration * 1000;

    setTimeout(function () {
        audio.pause(); // Pauses the audio
        audio.currentTime = 0; // Resets the audio to the start
    }, delay);
}

pywebview.api
    .music()
    .then((state) => {
        console.log(state);
        if (state) {
            playOST1(70);
        }
    })
    .catch((error) => {
        console.error("Error fetching music state:", error);
    });
