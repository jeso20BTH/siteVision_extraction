/**
 * Main file of the program that saves data from siteVision to mariaDB.
 *
 * @file    The main file for the program.
 * @author  Jesper Stolt
 */

// External module imports
let axios = require('axios');

// User built module imports
let fh = require('./modules/filehandler')
let api = require('./modules/apihandler')
let db = require('./modules/db');

// If page name is in array bellow, the loop skips.
let skipArray = [
    'Page Content',
    'Rating Repository',
    'Metadata Definition Repository'
]

async function main() {
    let parents = (fh.checksIfFileExists('files/parents.json')) ? await fh.readFile('files/parents.json') : [];
    // Get nodes ether from file or from request from API.
    let nodes = (fh.checksIfFileExists()) ? await fh.readFile() : [await api.getNodes()]

    while (nodes.length > 0) {
        let curNodeIndex = nodes.length - 1;
        let parent = (parents.length > 0) ? parents[parents.length - 1] : {
            id: null,
            name: null
        };
        let currentNode = nodes[curNodeIndex][0];

        // Removes current node from nodes node
        nodes[curNodeIndex].shift();
        // If current group of nodes is empty, remove it.
        if (nodes[nodes.length - 1].length === 0) {
            nodes.pop()
            parents.pop()
        }

        // Skip loop if name in skipArray
        if (skipArray.includes(currentNode.name)) {
            continue;
        }

        console.log(`Current node:   ${currentNode.name}`);
        let resNodes = await api.getNodes(currentNode.id);
        let resContent = await api.getHeadless(currentNode.id);

        // If result has child nodes add the as a group.
        if (resNodes.length > 0) {
            nodes.push(resNodes)
            parents.push({
                id: currentNode.id,
                name: (resContent) ? resContent.properties.displayName :currentNode.name
            })
        }

        // Checks if headless is useable
        if (resContent && resContent.properties.URL) {
            let errorCode, resHTML;
            try {
                resHTML = await api.getHTML(resContent.properties.URL);
            } catch (err) {
                if (err.response) {
                    errorCode = err.response.status;
                }
            }

            if (!errorCode) {
                db.add.entry(resContent, parent, resHTML)
            }
        // If headless isn't usable then fetch properties
        } else {
            let resProperties = await api.getProperties(currentNode.id);

            // Add entry if properties is useable
            if (resProperties && resProperties.properties.URL) {
                db.add.entryProperties(resProperties, parent)
            }
        }
        // Saves current nodes to file
        await fh.saveToFile(nodes);
        await fh.saveToFile(parents, 'files/parents.json')
    }

    process.exit()
}

// Start program
main()
