var app = null;
var scale24124 = 1;

function createDrawingApp() {
    // Create the HTML structure dynamically
    const body = document.body;
    
    // Create and style the canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width = 1280;  // Set canvas width to 1280px (720p width)
    canvas.height = 720;  // Set canvas height to 720px (720p height)
    canvas.style.border = '1px solid black';
    canvas.style.touchAction = 'none'; // Disable default touch actions like scrolling
    body.appendChild(canvas);
    
    // Create and style the color picker
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.id = 'colorPicker';
    colorPicker.value = '#000000'; // Default color
    colorPicker.style.position = 'fixed'; // Fix position to top-left corner
    colorPicker.style.bottom = '2%';
    colorPicker.style.left = '2%';
    colorPicker.style.zIndex = '1000'; // Ensure it's above other elements
    body.appendChild(colorPicker);

    const eraserButton = document.createElement('button');
    eraserButton.innerText = "Toggle Eraser: Off";
    eraserButton.style.position = 'fixed'; // Fix position to top-left corner
    eraserButton.style.bottom = '2%';
    eraserButton.style.right = '2%';
    eraserButton.style.fontSize = "10px";
    eraserButton.style.zIndex = '1000'; // Ensure it's above other elements
    eraserButton.onclick = function(event) {
        if (currentColor !== "#f4f4f4") {
            currentColor = "#f4f4f4"
            ctx.lineWidth = 50;
            eraserButton.innerText = "Toggle eraser: On";
        } else {
            currentColor = lastColor;
            ctx.lineWidth = 5;
            eraserButton.innerText = "Toggle eraser: Off";
        }
    }
    body.appendChild(eraserButton);

    const problemLabel = document.createElement('label');
    problemLabel.innerText = problem;
    problemLabel.style.position = 'fixed'; // Fix position to top-left corner
    problemLabel.style.top = '2%';
    problemLabel.style.fontSize = "16px";
    problemLabel.style.zIndex = '1000'; // Ensure it's above other elements
    body.appendChild(problemLabel);

    // Get references to the canvas and color picker
    const ctx = canvas.getContext('2d');
    
    // Set initial drawing color and drawing state
    let currentColor = colorPicker.value;
    let lastColor = currentColor;
    let isDrawing = false;
    let drawingEnabled = true; // Function variable to enable/disable drawing
    
    // Update canvas size and scale based on viewport
    function resizeCanvas() {
        const colorPickerHeight = colorPicker.offsetHeight; // Get the height of the color picker
        const availableHeight = window.innerHeight - colorPickerHeight; // Space available for canvas
        const scaleX = window.innerWidth / 1280;
        const scaleY = availableHeight / 720;
        const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

        scale24124 = scale;

        // Apply scaling to canvas
        canvas.style.width = `${1280 * scale + 512}px`;
        canvas.style.height = `${720 * scale + 512}px`;

        // Adjust line width based on scale
        ctx.lineWidth = 5;
        ctx.lineCap = 'round'; // Set default line cap
    }
    
    // Call resizeCanvas initially and on window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Update current color when color picker changes
    colorPicker.addEventListener('input', (event) => {
        currentColor = event.target.value;
        lastColor = currentColor;
        ctx.lineWidth = 5;
        eraserButton.innerText = "Toggle eraser: Off";
    });

    // Utility function to get the canvas coordinates considering the scale
    function getCanvasCoords(event) {
        let rect = canvas.getBoundingClientRect();
        let x, y;
        if (event.type.startsWith('touch')) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }

        // Adjust for the scaling of the canvas
        const scaleX = canvas.offsetWidth / canvas.width;
        const scaleY = canvas.offsetHeight / canvas.height;

        // Scale coordinates based on canvas scaling
        x /= scaleX;
        y /= scaleY;

        return { x, y };
    }
    
    // Function to start drawing
    function startDrawing(event) {
        if (!drawingEnabled) return;
        isDrawing = true;
        draw(event);
    }
    
    // Function to stop drawing
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath(); // Begin a new path to avoid connecting lines
    }
    
    // Function to draw on the canvas
    function draw(event) {
        if (!isDrawing) return;
    
        const { x, y } = getCanvasCoords(event);
    
        ctx.strokeStyle = currentColor; // Set the color for drawing
    
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // Function to enable/disable drawing and download PNG if disabled
    function setDrawingEnabled(enabled) {
        drawingEnabled = enabled;
    }
    
    // Add event listeners for mouse and touch events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault(); // Prevent default touch actions like scrolling
        startDrawing(event);
    });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    canvas.addEventListener('touchmove', draw);

    // Expose the setDrawingEnabled function
    return {
        setDrawingEnabled,
        canvas
    };
}

function enableDrawing() {
    document.body.innerHTML = "";

    app = createDrawingApp();
    app.setDrawingEnabled(true);
    
    return app;
}

function disableDrawing() {
    console.log(app.canvas.toDataURL());

    socket.emit("drawing-complete", app.canvas.toDataURL())

    app.setDrawingEnabled(false);

    return app;
}
