import './style.scss';
import appState from './appState';

const tools = Array.from(document.querySelectorAll('.tool'));
const _canv = document.querySelector('.canvas canvas');
const context = createCanvas({ canvas: _canv });

tools.forEach(tool => tool.addEventListener('click', toolOnClick));

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

  return c;
}

function updateCanvas({ position }) {
  let size = 2;
  let color = 'rgb(0,0,0)';
  let canvas = appState.state.canvas;

  if (appState.state.currentTool?.id === 'tool-pen') {
    context.beginPath();
  
    context.lineWidth = size;
    context.lineCap = "round";
    context.strokeStyle = color;
    
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