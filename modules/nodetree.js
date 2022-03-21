/**
 * Handling the node tree.
 *
 * @file    This file contains an object of functions to handle the node tree.
 * @author  Jesper Stolt
 */

// User built module imports
let db = require('./db');

let tree = {
    /**
     * Returns the root node from database.
     * @returns {object}                        Returns the root node.
     */
    getRoot: async () => {
        return await db.get.oneFrom('page', {is_root: 1})
    },

    /**
     * Gets the children of an node.
     * @param   {string}        nodeId          The id of the node you want to get children of.
     * @returns {array}                         Returns the children of the node.
     */
    getChildren: async (nodeId) => {
        return await db.get.allFrom('child', {parent_id: nodeId})
    },

    /**
     * Gets all columns for an node from database.
     * @param   {string}        nodeId          The id of the node you want to get from database.
     * @returns {object}                        Returns the node as an object.
     */
    getNode: async(nodeId) => {
        return await db.get.oneFrom('page', {'jcr_id': nodeId})
    },

    /**
     * Prints the tree with '-' to mark how deep in the tree an node is.
     * @returns {void}
     */
    drawTree: async () => {
        let level = 0;
        let root = await tree.getRoot()
        let nodes = [await tree.getChildren(root.id)]

        console.log(`${'-'.repeat(level)}${root.display_name}`);
        level++;

        while (nodes.length > 0) {
            let currentNodeIndex = nodes.length - 1
            let currentNode = await tree.getNode(nodes[currentNodeIndex][0].child_id)

            if (currentNode) {
                console.log(`${'-'.repeat(level)}${currentNode.display_name}`);
            }

            nodes[currentNodeIndex].shift();
            if (nodes[currentNodeIndex].length === 0) {
                nodes.pop()
                level--;
            }

            if (currentNode) {
                let nodeChildren = await tree.getChildren(currentNode.id)

                if (nodeChildren.length > 0) {
                    nodes.push(nodeChildren)
                    level++;
                }
            }
        }
    }
}

module.exports = tree
