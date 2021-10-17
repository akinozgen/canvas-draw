export default {
    state: {
        currentTool: null,
        context: null,
        canvas: null,
        settings: {
            size: 5,
            color: 'rgba(0,0,0,1)',
            falloff: 5
        }
    },
    commit(callback) {
        this.state = callback(this.state);
    }
};