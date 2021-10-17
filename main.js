import './style.scss';
import appState from './appState';

const tools = Array.from(document.querySelectorAll('.tool'));

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