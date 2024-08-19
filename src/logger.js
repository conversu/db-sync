

class Logger {

    #show;

    constructor(mode) {
        this.#show = false
        this.setMode(mode);
    }

    setMode(mode) {
        this.#show = mode.toLowerCase() === 'debug';
    }


    log(content) {
        if (this.#show) {
            console.log(content)
        }
    }

    error(content) {
        console.error(content)
    }
}


export default Logger;