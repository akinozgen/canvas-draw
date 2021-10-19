import './style.scss';
import appState from './appState';
import FloodFill from 'q-floodfill';

// Get necessary elements from html
const tools = Array.from(document.querySelectorAll('.tool'));
const settings = Array.from(document.querySelectorAll('.tool-settings .setting'));
const _canv = document.querySelector('.canvas canvas');
const context = createCanvas({ canvas: _canv });
const btnSave = tools.filter(t => t.id === 'tool-save')[0];
const btnFullscreen = document.getElementById('toggle-fullscreen');

// Get settings elements and add event listeners
settings.forEach(setting => {
  let input = setting.querySelector('input');

  if (appState.state.settings[setting.id]) {
    input.value = appState.state.settings[setting.id];
  }

  input.onchange = settingUpdate;
  input.oninput = settingUpdate;
});

// Set click listener for tools
tools.forEach(tool => tool.addEventListener('click', toolOnClick));

// Set hold&drag(draw) and click(fill) listener for canvas
appState.state.canvas.addEventListener('mouseup', mouseReleased);
appState.state.canvas.addEventListener('click', bucketFill);
btnFullscreen.addEventListener('click', toggleFullscreen);

// If mouse leaves canvas while holding down, reset drag state
appState.state.canvas.addEventListener('mousedown', () => appState.commit(state => {
  state.clicked = true;
  return state;
}));

// Update canvas if mouse is dragging
appState.state.canvas.addEventListener('mousemove', (e) => {
  if (!appState.state.clicked) return;
  
  updateCanvas({ position: { x: e.layerX, y: e.layerY } });
});

// Set click listener for save button
btnSave.onclick = save;

// Handle change of settings inputs
// Get target element and its container. Setting name is on the container id
function settingUpdate(e) {
  let val = e.srcElement.value;
  let container = e.path.filter(_ => _?.classList?.contains('setting'))[0];
  if (!container) return;
  let setting = container.id;

  appState.commit(state => {
    state.settings[setting] = val;
    return state;
  });
}
 
// Update active tool state. Remove active class from all other tools and set new tool to active
// Add tool name (id prop) to appstates current tool
function toolOnClick(e) {
  tools.forEach(tool => tool.classList.remove('active'));
  const currentTool = e.path.filter(_ => _?.classList?.contains('tool'))[0];
  if (!currentTool || currentTool.id === 'tool-save') return;

  currentTool.classList.add('active');

  appState.commit((state) => {
    state.currentTool = currentTool;
    return state;
  });
}

// Initialize default canvas, fill with white color and return its 2Dcontext
function createCanvas({ canvas }) {
  let c = canvas.getContext('2d');

  appState.commit(state => {
    state.canvas = canvas;
    state.context = c;

    return state;
  });

  c.fillStyle = 'rgb(255, 255, 255)';
  c.fillRect(0, 0, canvas.width, canvas.height);

  return c;
}

// Resets drag status
// Resets previous pen position to prevent continuous lines
function mouseReleased() {
  appState.commit(state => {
    state.clicked = false;
    state.penPrevPosition = null;
    return state;
  });
}

// Save/Download event handler
// Creates a link tag and prepares it to download an image.
// Gets base64 data string of canvas content and puts it to link tags href property.
// Then clicks link automatically.
function save(e) {
  let data = appState.state.canvas.toDataURL("image/jpeg", 1.0);

  let a = document.createElement('a');
  a.href = data;
  a.download = prompt('Filename: ', `${Date.now()}.jpg`);
  document.body.appendChild(a);
  a.click();
}

// Flood fill clicked area.
// FloodFill package handles rest.
function bucketFill(e) {
  if (appState.state.currentTool?.id !== 'tool-fill') return;
  const { layerX: x, layerY: y } = e;
  const { canvas, settings } = appState.state;
  
  const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
  const ff = new FloodFill(imgData);

  ff.fill(settings.color, x, y, 0);
  context.putImageData(ff.imageData, 0, 0);
  
}

// Fullscreen canvas toggler onlick handler
function toggleFullscreen(e) {
  const canvasHolder = document.getElementById('canvas-holder');

  if (canvasHolder.classList?.contains('fullscreen')) {
    appState.state.canvas.width = 650;
    appState.state.canvas.height = 650;

    return canvasHolder.classList?.remove('fullscreen');
  }

  appState.state.canvas.width = window.innerWidth;
  appState.state.canvas.height = window.innerHeight;
  canvasHolder.classList?.add('fullscreen');
}

// Hell breaks loose here :)
function updateCanvas({ position }) {
  // Get all necessary settings, current tool name, previous pixel positon and canvas reference
  let size = appState.state.settings.size;
  let falloff = appState.state.settings.falloff;
  let color = appState.state.settings.color;
  let canvas = appState.state.canvas;
  let tool = appState.state.currentTool?.id;
  let previousPosition = appState.state.penPrevPosition;

  // If current tool is draggable (eraser, pencil, brush)
  if (tool === 'tool-pen' || tool === 'tool-eraser' || tool === 'tool-brush') {
    // Start drawing
    context.beginPath();
  
    // Set canvas context properties from appstates settings object
    context.lineWidth = size;
    context.lineCap = "round";
    context.strokeStyle = tool === 'tool-eraser' ? 'rgb(255, 255, 255)' : color;

    // Defaults shadow to none so pencil and eraser doesnt get a weird border 
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowColor = '';

    // If the tool is eraser, default its color to white and adjust falloff
    if (tool === 'tool-eraser') {
      context.shadowBlur = falloff;
      context.shadowColor = 'rgb(255, 255, 255)';
    }

    // If the tool is brush, use color setting as shadow color too
    if (tool === 'tool-brush') {
      context.shadowBlur = falloff;
      context.shadowColor = color;
    }
    
    // Move canvas draw cursor to clicked area
    // Create a line from clicked pixel to previous pixel position
    // If its the first time then create a line just at clicked area 
    context.moveTo(position.x, position.y);
    context.lineTo(
      previousPosition ? previousPosition.x : position.x,
      previousPosition ? previousPosition.y : position.y
    );

    // Save current position as previous position to state
    appState.commit(state => {
      state.penPrevPosition = position;
      return state;
    });

  }

  // Finish drawing
  context.stroke();
}
