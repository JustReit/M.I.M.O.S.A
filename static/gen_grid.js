let clickedCells = [];
let selectedCells = []
let isEventListened = false;
let canvas;
function drawGrid(mode, rows, columns, startX, startY, orientation, serpentine) {
    // Convert string values to lowercase
    if (typeof startX === 'string') {
        startX = startX.toLowerCase();
    }
    if (typeof startY === 'string') {
        startY = startY.toLowerCase();
    }
    if (typeof orientation === 'string') {
        orientation = orientation.toLowerCase();
    }
    if (typeof serpentine === 'string') {
        serpentine = serpentine.toLowerCase();
    }

    const canvasContainer = document.getElementById(mode + '-canvas-container');
    const responsiveCanvas = document.getElementById(mode + '-responsive-canvas');
    const theme = localStorage.getItem('theme')

    // Get the actual pixel width of the canvas container
    let containerStyle = window.getComputedStyle(canvasContainer);
    let containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    let containerWidth = canvasContainer.clientWidth - containerPadding;
    let containerHeight = canvasContainer.clientHeight;
    responsiveCanvas.width = containerWidth;
    responsiveCanvas.height = containerHeight;
    if (mode === "esp") {
        rows = parseInt(document.getElementById('esp_rows').value);
        columns = parseInt(document.getElementById('esp_columns').value);
        startX = document.getElementById('esp_startx').options[document.getElementById('esp_startx').selectedIndex].getAttribute("data-startx").toLowerCase();
        startY = document.getElementById('esp_starty').options[document.getElementById('esp_starty').selectedIndex].getAttribute("data-starty").toLowerCase();
        orientation = document.getElementById('esp_orientation').options[document.getElementById('esp_orientation').selectedIndex].getAttribute("data-orientation").toLowerCase();
        serpentine = document.getElementById('esp_serpentine').options[document.getElementById('esp_serpentine').selectedIndex].getAttribute("data-serpentine").toLowerCase();

    }else {
        if (startX == 1) {
            startX = "right";
        }

        if (orientation == 1) {
            orientation =  "vertical";
        }
    }
    // Checking for serpentine === "0"
    let serpentineOff = serpentine === "0";
    columns = parseInt(columns);
    rows = parseInt(rows);


    canvas = document.getElementById(mode + '-responsive-canvas');
    let ctx = canvas.getContext('2d');
    let lineWidth = 2;
    let boxSize = (canvas.width - lineWidth) / columns;

    //Overflow detection if canvas is too small for amount of columns
    if (boxSize <= 60) {
        boxSize = 60;
        canvas.width = (boxSize * columns) + lineWidth;
        canvasContainer.style.overflowX = 'scroll';

    }
    canvas.height = (boxSize * rows) + lineWidth;

    let lineColour = "#0d6efd";
    let gridColour = "#6c757d";
    let offset = 0;
    let startIndicatorX = 0
    let startIndicatorY = 0
    let endIndicatorX = 0
    let endIndicatorY = 0
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = lineWidth;
    let halfLineWidth = lineWidth / 2;
    // Draw grid
    ctx.strokeStyle = gridColour;
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        let y = i * boxSize + halfLineWidth; // Add half of the line width
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    for (let j = 0; j <= columns; j++) {
        ctx.beginPath();
        let x = j * boxSize + halfLineWidth; // Add half of the line width
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    // Draw line
    ctx.strokeStyle = lineColour;
    if(!serpentineOff) {
        if (orientation === "horizontal") {
            // Draw horizontal lines
            for (let i = 0; i <= rows - 1; i++) {
                ctx.beginPath();
                const y = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                ctx.moveTo(boxSize / 2, y);
                ctx.lineTo(canvas.width - (boxSize / 2), y);
                ctx.stroke();
            }
            // Draw vertical lines
            if (columns > 1) {
                ctx.setLineDash([boxSize]);
            }
            if (startY === "top") {
                startIndicatorY = 0;
                endIndicatorY = rows - 1;
            } else if (startY === "bottom") {
                startIndicatorY = rows - 1;
                endIndicatorY = 0;
            }
            if (startX === "left") {
                offset = startY === "top" ? boxSize : (boxSize * (rows % 2)) + boxSize;
                startIndicatorX = 0;
                endIndicatorX = rows % 2 ? columns - 1 : 0;
            } else if (startX === "right") {
                offset = startY === "top" ? 0 : boxSize * (rows % 2);
                startIndicatorX = columns - 1;
                endIndicatorX = rows % 2 ? 0 : columns - 1;
            }
            for (let i = 0; i <= columns - 1; i++) {
                if (i === 0) {
                    ctx.lineDashOffset = offset;
                } else if (i === columns - 1) {
                    ctx.lineDashOffset = offset + boxSize;
                }
                if (i === 0 || i === columns - 1) {
                    ctx.beginPath();
                    let x = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                    ctx.moveTo(x, boxSize / 2);
                    ctx.lineTo(x, canvas.height - (boxSize / 2));
                    ctx.stroke();
                }
            }
        } else {
            // Draw vertical lines
            for (let i = 0; i <= columns - 1; i++) {
                ctx.beginPath();
                let x = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                ctx.moveTo(x, boxSize / 2);
                ctx.lineTo(x, canvas.height - (boxSize / 2));
                ctx.stroke();
            }
            // Draw horizontal lines
            if (rows > 1) {
                ctx.setLineDash([boxSize]);
            }
            if (startX === "left" && startY === "top") {
                offset = boxSize;
                startIndicatorX = 0;
                startIndicatorY = 0;
                endIndicatorX = columns - 1;
                if (columns % 2) {
                    endIndicatorY = rows - 1;
                } else {
                    endIndicatorY = 0;
                }
            } else if (startX === "right" && startY === "top") {
                offset = (boxSize * (columns % 2)) + boxSize;
                startIndicatorX = columns - 1;
                startIndicatorY = 0;
                endIndicatorX = 0;
                if (columns % 2) {
                    endIndicatorY = rows - 1;
                } else {
                    endIndicatorY = 0;
                }
            }
            if (startX === "left" && startY === "bottom") {
                offset = 0;
                startIndicatorY = rows - 1;
                startIndicatorX = 0;
                endIndicatorX = columns - 1;
                if (columns % 2) {
                    endIndicatorY = 0;
                } else {
                    endIndicatorY = rows - 1;
                }
            } else if (startX === "right" && startY === "bottom") {
                offset = boxSize * (columns % 2);
                startIndicatorY = rows - 1;
                startIndicatorX = columns - 1;
                endIndicatorX = 0;
                if (columns % 2) {
                    endIndicatorY = 0;
                } else {
                    endIndicatorY = rows - 1;
                }
            }
            for (let i = 0; i <= rows - 1; i++) {
                if (i === 0) {
                    ctx.lineDashOffset = offset;
                } else if (i === rows - 1) {
                    ctx.lineDashOffset = offset + boxSize;
                }
                if (i === 0 || i === rows - 1) {
                    ctx.beginPath();
                    let y = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                    ctx.moveTo(boxSize / 2, y);
                    ctx.lineTo(canvas.width - (boxSize / 2), y);
                    ctx.stroke();
                }
            }
        }
    }
    else {
        if (orientation === "horizontal") {
            // Draw horizontal lines
            for (let i = 0; i <= rows - 1; i++) {
                ctx.beginPath();
                const y = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                ctx.moveTo(boxSize / 2, y);
                ctx.lineTo(canvas.width - (boxSize / 2), y);
                ctx.stroke();
            }
            // Draw vertical lines
            if (columns > 1) {
                ctx.setLineDash([boxSize]);
            }
            if (startY === "bottom") {
                startIndicatorY = 0;
                endIndicatorY = rows - 1;
            } else if (startY === "top") {
                startIndicatorY = rows - 1;
                endIndicatorY = 0;
            }
            if (startX === "left") {
                startIndicatorX = columns - 1;
                endIndicatorX =  0;
            } else if (startX === "right") {
                startIndicatorX = 0;
                endIndicatorX =  columns - 1;
            }
        } else {
            // Draw vertical lines
            for (let i = 0; i <= columns - 1; i++) {
                ctx.beginPath();
                let x = (i * boxSize + halfLineWidth) + (boxSize / 2); // Add half of the line width
                ctx.moveTo(x, boxSize / 2);
                ctx.lineTo(x, canvas.height - (boxSize / 2));
                ctx.stroke();
            }
            // Draw horizontal lines
            if (rows > 1) {
                ctx.setLineDash([boxSize]);
            }
            if (startX === "left" && startY === "top") {
                startIndicatorX = 0;
                startIndicatorY = 0;
                endIndicatorX = columns - 1;
                endIndicatorY = rows - 1;

            } else if (startX === "right" && startY === "top") {
                startIndicatorX = columns - 1;
                startIndicatorY = 0;
                endIndicatorX = 0;
                endIndicatorY = rows - 1;


            }
            if (startX === "left" && startY === "bottom") {

                startIndicatorY = rows - 1;
                startIndicatorX = 0;
                endIndicatorX = columns - 1;
                endIndicatorY = 0;

            } else if (startX === "right" && startY === "bottom") {
                startIndicatorY = rows - 1;
                startIndicatorX = columns - 1;

                endIndicatorX = 0;
                endIndicatorY = 0;

            }
        }
    }


        // Draw circles in the middle of each grid square
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            let circleCenterX = j * boxSize + boxSize / 2 + halfLineWidth;
            let circleCenterY = i * boxSize + boxSize / 2 + halfLineWidth;
            let circleRadius = Math.min(boxSize, boxSize) / 15;
            ctx.beginPath();
            ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffc107';
            ctx.fill();

            // Draw the cell number

            if (theme === 'dark') {
                ctx.fillStyle = 'white'; // Set text color for dark theme
            } else {
                ctx.fillStyle = 'black'; // Set text color for light theme or other themes
            }
            ctx.font = `${boxSize / 5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const cellNumber = calculateLedNumber(i, j, startX, startY, orientation, rows, columns, serpentine);
            ctx.fillText(cellNumber.toString(), circleCenterX + boxSize/5, circleCenterY - boxSize/5);
        }
    }
    let indicatorCircleRadius = Math.min(boxSize, boxSize) / 8;
    let startCircleCenterX = startIndicatorX * boxSize + boxSize / 2 + halfLineWidth;
    let startCircleCenterY = startIndicatorY * boxSize + boxSize / 2 + halfLineWidth;
    ctx.beginPath();
    ctx.arc(startCircleCenterX, startCircleCenterY, indicatorCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#198754';
    ctx.fill();
    let endCircleCenterX = endIndicatorX * boxSize + boxSize / 2 + halfLineWidth;
    let endCircleCenterY = endIndicatorY * boxSize + boxSize / 2 + halfLineWidth;
    ctx.beginPath();
    ctx.arc(endCircleCenterX, endCircleCenterY, indicatorCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#dc3545';
    ctx.fill();

    if (mode === "item") {
        if (!isEventListened) {

            canvas.addEventListener('click', function (event) {
                handleCellClick(event, mode);
            });

            isEventListened = true;

        }
        redrawGrid(rows, columns, "item", startX, startY,orientation, serpentine);
    }

}
function handleCellClick(event, mode) {
    const selectEspDropdown = document.getElementById('item_esp_select');
    const rows = parseInt(selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-rows"));
    const columns = parseInt(selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-columns"));
    let startX = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-start-x").toLowerCase();
    const startY = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-start-y").toLowerCase();
    let orientation = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-orientation").toLowerCase();
    let serpentine = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-serpentine").toLowerCase();

    if (startX == 1) {
        startX = "right";
    }
    //console.log("Processed StartX:", startX);  // Debugging processed startX
    if (orientation == 1) {
        orientation =  "vertical";
    }

    const canvas = document.getElementById(mode + '-responsive-canvas');
    const canvasContainer = document.getElementById(mode + '-canvas-container');
    let lineWidth = 2;
    let boxSize = (canvas.width - lineWidth) / columns;
    if (boxSize <= 60) {
        boxSize = 60;
    }

    // Get the size and position of the canvas
    let rect = canvas.getBoundingClientRect();

    // Calculate the x and y coordinates of the click relative to the canvas
    let offsetX = rect.left + window.scrollX;  // Ensure offsetX accounts for window scroll
    let x = event.clientX - offsetX;
    let y = event.clientY - rect.top ;

    //console.log("Click coordinates relative to canvas - X:", x, "Y:", y);  // Debugging click coordinates

    // Calculate which row and column was clicked based on the click coordinates
    let clickedRow = Math.floor(y / boxSize);
    let clickedColumn = Math.floor(x / boxSize);

    //console.log("ClickedRow:", clickedRow, "ClickedColumn:", clickedColumn);  // Debugging clicked row and column

    const ledNumber = calculateLedNumber(clickedRow, clickedColumn, startX, startY, orientation, rows, columns, serpentine);

    // Find if the clicked cell is already in the clickedCells array
    let cellIndex = clickedCells.indexOf(ledNumber);

    // If the clicked cell is not in the array, add it; otherwise, remove it
    if (cellIndex === -1) {
        clickedCells.push(ledNumber);
    } else {
        clickedCells.splice(cellIndex, 1);
    }

    redrawGrid(rows, columns, "item", startX, startY, orientation, serpentine);
}


function calculateLedNumber(row, column, startX, startY, orientation, rows, columns, serpentine) {
    if (startX === "right") {
        column = columns - column - 1; // Ensure accurate column reversal
    }
    if (startY === "bottom") {
        row = rows - row - 1;
    }

    if (orientation === "horizontal") {
        if (serpentine === "1") {
            const isEvenRow = row % 2 === 0;
            return isEvenRow ? row * columns + column + 1 : (row + 1) * columns - column;
        } else {
            return row * columns + column + 1;
        }
    } else {
        if (serpentine === "1") {
            const isEvenColumn = column % 2 === 0;
            return isEvenColumn ? column * rows + row + 1 : (column + 1) * rows - row;
        } else {
            return column * rows + row + 1;
        }
    }
}


function redrawGrid(rows, columns, mode, startX, startY, orientation, serpentine) {
     canvas = document.getElementById(mode + '-responsive-canvas');

    let ctx = canvas.getContext('2d');
    let lineWidth = 2;
    let boxSize = (canvas.width - lineWidth) / columns;
    if(boxSize <= 60) {
        boxSize = 60;
    }
    ctx.lineWidth = lineWidth;
    let halfLineWidth = lineWidth / 2;
    let circleRadius = Math.min(boxSize, boxSize) / 15;
    let indicatorCircleRadius = Math.min(boxSize, boxSize) / 8;
    // Loop through rows and columns of the grid
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            let cellNumber = calculateLedNumber(i, j, startX, startY, orientation, rows, columns, serpentine);
            let isClicked = clickedCells.includes(cellNumber);
            // Check if the current cell is the start or end point
            let isStartPoint = cellNumber === 1
            let isEndPoint = cellNumber === rows*columns ;
            // Calculate the center and radius of the circle to be drawn for each cell
            let circleCenterX = j * boxSize + boxSize / 2 + halfLineWidth;
            let circleCenterY = i * boxSize + boxSize / 2 + halfLineWidth;


            // Draw the cell with the number
            ctx.beginPath();

            // Change color based on the state
            if (isStartPoint && !isClicked) {
                ctx.arc(circleCenterX, circleCenterY, indicatorCircleRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#198754'; // Change color for start point
            } else if (isEndPoint && !isClicked) {
                ctx.arc(circleCenterX, circleCenterY, indicatorCircleRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#dc3545'; // Change color for end point
            } else {
                ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
                ctx.fillStyle = isClicked ? '#003ef8' : '#ffc107';
            }
            ctx.fill();

        }
    }
}


function TestLights() {
    const selectedEspIndex = selectEspDropdown.selectedIndex;
    const selectedEsp = selectEspDropdown.options[selectedEspIndex];
    if (selectedEsp.disabled) {
        // Nothing is selected or "Please add an ESP device first..." is selected, so we can't proceed
        alert("Please select an ESP to Test.");
        return;
    }
    const ip = selectedEsp.dataset.espIp;
    const data = {};
    data[ip] = clickedCells;
    fetch('/test_lights', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then()
        .catch((error) => {
            console.error('Error:', error);
        });
}


function clearAll() {
    clickedCells.length = 0;
    selectedCells.length = 0;
    // Clear the stored data in the 'led_positions' key
    localStorage.removeItem('led_positions');
    const selectEspDropdown = document.getElementById('item_esp_select');
    const rows = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-rows");
    const columns = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-columns");
    let startX = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-start-x").toLowerCase();
    const startY = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-start-y").toLowerCase();
    let orientation = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-orientation").toLowerCase();
    let serpentine = selectEspDropdown.options[selectEspDropdown.selectedIndex].getAttribute("data-esp-serpentine").toLowerCase();
    if (startX == 1) {
        startX = "right";
    }
    if (orientation == 1) {
        orientation =  "vertical";
    }
    redrawGrid(parseInt(rows), parseInt(columns), "item", startX, startY, orientation, serpentine);
}

function submitLights() {
    localStorage.removeItem('led_positions');
    // Retrieve existing LED positions from localStorage
    let savedData = JSON.parse(localStorage.getItem('led_positions')) || [];

    // Save LED positions to localStorage
    savedData = savedData.concat(clickedCells.sort());
    // Save updated data back to localStorage
    localStorage.setItem('led_positions', JSON.stringify(savedData));
}

document.getElementById('test_led_button').addEventListener('click',TestLights);
document.getElementById('clear_led_button').addEventListener('click',clearAll);





