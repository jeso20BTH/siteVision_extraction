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
    try {
        await db.checkConnection();
    } catch (e) {
        console.log(e);
        console.log('Error: Unable to establish connection to database!');
        console.log('Shuting down program...');
        process.exit()
    } finally {
        console.log('Connection established to database!');
    }
    let parents = (fh.checksIfFileExists('files/parents.json')) ? await fh.readFile('files/parents.json') : [];
    // Get nodes ether from file or from request from API.
    let nodes = (fh.checksIfFileExists()) ? await fh.readFile() : [await api.getNodes()]

    let nodeCounter = 0;
    let noHTMLCounter = 0;


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

        // console.log(`Current node:   ${currentNode.name}`);
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

        let resProperties;

        // Checks if headless is useable
        if (resContent) {
            if (resContent.properties.published) {
                let resHTML, errorHandler;

                //Tries to fetch HTML-page
                try {
                    resHTML = await api.getHTML(resContent.properties.URL);
                } catch (e) {
                    errorHandler = e
                    // If fetch is unsuccessful add without HTML code
                    try {
                        await db.add.entry(resContent, parent)
                        nodeCounter++;
                        noHTMLCounter++;
                    } catch (e) {
                        console.log(`Nodes: ${nodeCounter}`, `Nodes with no HTML: ${noHTMLCounter}`);
                        console.log('Error: Unable to establish connection to database!');
                        console.log('Shuting down program...');
                        process.exit()
                    }
                } finally {
                    // If successful add with HTML code.
                    if (!errorHandler) {
                        try {
                            await db.add.entry(resContent, parent, resHTML)
                            nodeCounter++;
                        } catch (e) {
                            console.log(`Nodes: ${nodeCounter}`, `Nodes with no HTML: ${noHTMLCounter}`);
                            console.log('Error: Unable to establish connection to database!');
                            console.log('Shuting down program...');
                            process.exit()
                        }
                    }

                    errorHandler = null;
                }
            // If page is not published no fetch of page is needed.
            } else {
                try {
                    await db.add.entry(resContent, parent)
                    nodeCounter++;
                    noHTMLCounter++;
                } catch (e) {
                    console.log(`Nodes: ${nodeCounter}`, `Nodes with no HTML: ${noHTMLCounter}`);
                    console.log('Error: Unable to establish connection to database!');
                    console.log('Shuting down program...');
                    process.exit()
                }
            }
        // If headless isn't usable then fetch properties
        } else {
            // Fetch properties
            while (!resProperties) {
                resProperties = await api.getProperties(currentNode.id);
            }
            // Add entry if properties is useable
            if (resProperties) {
                try {
                    nodeCounter++;
                    await db.add.entryProperties(resProperties, parent, resNodes)
                } catch (e) {
                    console.log(e);
                    console.log(`Nodes: ${nodeCounter}`, `Nodes with no HTML: ${noHTMLCounter}`);
                    console.log('Error: Unable to establish connection to database!');
                    console.log('Shuting down program...');
                    process.exit()
                }
            }
        }
        // Saves current nodes to file
        await fh.saveToFile(nodes);
        await fh.saveToFile(parents, 'files/parents.json')
    }

    console.log(`Nodes: ${nodeCounter}`, `Nodes with no HTML: ${noHTMLCounter}`);
    let createdNodes = await db.count.page();
    console.log(`Nodes in database: ${createdNodes}`);

    process.exit()
}

// Start program
main()
