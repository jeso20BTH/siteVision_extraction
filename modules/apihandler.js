/**
 * Handling API-requests.
 *
 * @file    This file contains an object of functions to API requests.
 * @author  Jesper Stolt
 */

// External module imports
let axios = require('axios');

// Import config-file for handeling URL.
const config = require('./config_url.json');

let apiHandler = {
    baseURL: config.baseURL,
    baseURI: config.baseURI,

    /**
     * Gets nodes for an URI, if no URI given then it gets root-node.
     * @param   {string}        [uri=baseURI]       The URI you wanna get nodes for.
     * @returns {object}                            Returns the nodes for URI
     */
    getNodes: async (uri=apiHandler.baseURI) => {
        let nodes;
        try {
            nodes = (await axios.get(`${apiHandler.baseURL}${uri}/nodes`)).data;
        } catch (err) {
            nodes = [];
        }

        return nodes;
    },

    /**
     * Gets headless for an given URI, if no headless, then return undefined
     * @param   {string}        uri                 The URI you wanna get headless for.
     * @returns {object}                            Returns the headless for URI.
     */
    getHeadless: async (uri) => {
        let headless;

        try {
            headless = (await axios.get(`${apiHandler.baseURL}${uri}/headless`)).data;
        } catch (error) {
            headless = undefined;
        }

        return headless;
    },

    /**
     * Gets properties for an given URI, if no properties, then return undefined
     * @param   {string}        uri                 The URI you wanna get properties for.
     * @returns {object}                            Returns the properties for URI.
     */
    getProperties: async (uri) => {
        let res = {nodes: [], contentNodes: []};

        try {
            res.properties = (await axios.get(`${apiHandler.baseURL}${uri}/properties`)).data;
        } catch (error) {
            res = undefined;
        }

        return res;
    },

    /**
     * Gets HTML for an given URL
     * @param   {string}        url                 The URL you wanna get HTML-code for.
     * @returns {string}                            Returns the HTML-code for URL.
     */
    getHTML: async (url) => {
        return (await axios.get(url)).data
    },

    /**
     * Checks if an node is the root node.
     * @param   {string}        nodeId              The node id for the node you wanna check if it is the root node.
     * @returns {boolean}                           Returns thetrue if node is root node.
     */
    isRootNode: async (nodeId) => {
        let rootId
        try {
            let rootId = (await apiHandler.getNodes())[0].id;
        } catch (e) {
            return false
        } finally {
            return nodeId === rootId
        }
    }
}

module.exports = apiHandler;
