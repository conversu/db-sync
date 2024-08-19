

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
        if (this.#show) {
            console.error(content)
        }
    }
}


export default Logger;