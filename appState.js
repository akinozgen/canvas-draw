export default {
    state: {
        currentTool: null,
        context: null,
        canvas: null
    },
    commit(callback) {
        this.state = callback(this.state);
    }
};