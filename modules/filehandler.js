/**
 * Handling read and write to files.
 *
 * @file    This file contains an object of functions to handle files.
 * @author  Jesper Stolt
 */

// External module imports
const fs = require('fs');

let fileHandler = {
    // File used if fileName not specified
    defaultFileName: 'files/nodes.json',

    /**
     * Check if the file exists.
     * @param   {string}        [filename=defaultFileName]  The name of the file you want to check if it exists.
     * @returns {boolean}                                   Returns true if the file exists
     */
    checksIfFileExists: (fileName=fileHandler.defaultFileName) => {
        return fs.existsSync(fileName)
    },

    /**
     * Reads from an file
     * @param   {string}        [filename=defaultFileName]  The name of the file you want to read from.
     * @returns {object}                                    Returns the file as an JSON-object.
     */
    readFile: (fileName=fileHandler.defaultFileName) => {
        let nodes = JSON.parse(fs.readFileSync(fileName, 'utf8'))

        return nodes
    },

    /**
     * Writes an object as an JSON-stringify representation.
     * @param   {object}        data                        What you wanna writ to the file.
     * @param   {string}        [filename=defaultFileName]  The name of the file you want to write to.
     * @returns {void}
     */
    saveToFile: async (data, fileName=fileHandler.defaultFileName) => {
        try {
            await fs.writeFileSync(fileName, JSON.stringify(data))
        } catch (err) {
            console.error(err)
        }
    }
}

module.exports = fileHandler;
