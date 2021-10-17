import './style.scss';
import appState from './appState';

const tools = Array.from(document.querySelectorAll('.tool'));
const settings = Array.from(document.querySelectorAll('.tool-settings .setting'));
const _canv = document.querySelector('.canvas canvas');
const context = createCanvas({ canvas: _canv });

settings.forEach(setting => {
  let input = setting.querySelector('input');

  if (appState.state.settings[setting.id]) {
    input.value = appState.state.settings[setting.id];
  }

  input.onchange = settingUpdate;
  input.oninput = settingUpdate;
});
tools.forEach(tool => tool.addEventListener('click', toolOnClick));

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
 
function toolOnClick(e) {
  tools.forEach(tool => tool.classList.remove('active'));
  const currentTool = e.path.filter(_ => _?.classList?.contains('tool'))[0];
  if (!currentTool) return;

  currentTool.classList.add('active');

  appState.commit((state) => {
    state.currentTool = currentTool;
    return state;
  });
}

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

function updateCanvas({ position }) {
  let size = appState.state.settings.size;
  let color = appState.state.settings.color;
  let canvas = appState.state.canvas;
  let tool = appState.state.currentTool?.id;

  if (tool === 'tool-pen' || tool === 'tool-eraser') {
    context.beginPath();
  
    context.lineWidth = size;
    context.lineCap = "round";
    context.strokeStyle = tool === 'tool-eraser' ? 'rgb(255, 255, 255)' : color;
    
    context.moveTo(position.x, position.y);
    context.lineTo(
      appState.state.penPrevPosition ? appState.state.penPrevPosition.x : position.x,
      appState.state.penPrevPosition ? appState.state.penPrevPosition.y : position.y
    );

    appState.commit(state => {
      state.penPrevPosition = position;
      return state;
    });

  }

  context.stroke();
}

function mouseReleased() {
  appState.commit(state => {
    state.clicked = false;
    state.penPrevPosition = null;
    return state;
  });
}


appState.state.canvas.addEventListener('mouseup', mouseReleased);
appState.state.canvas.addEventListener('mouseleave', mouseReleased);


appState.state.canvas.addEventListener('mousedown', () => appState.commit(state => {
  state.clicked = true;
  return state;
}));

appState.state.canvas.addEventListener('mousemove', (e) => {
  if (!appState.state.clicked) return;
  
  updateCanvas({ position: { x: e.layerX, y: e.layerY } });
});