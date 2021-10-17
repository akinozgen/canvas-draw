export default {
    state: {
        currentTool: null
    },
    commit(callback) {
        this.state = callback({ state: this.state });
        console.log(this.state);
    }
};