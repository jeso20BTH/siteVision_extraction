/**
 * Functions for interacting with n database. Databse connection is specified in the config.json file.
 * It needs to contain the following parameters:
 * @param   host        On what server the database exists.
 * @param   port        what port on the host the database runs
 * @param   user        The name of the user to access the database with.
 * @param   password    The password of the user to access the database with.
 * @param   database    The name of the database you wanna access on the host.
 *
 * @file                This file contains an object of functions for database-handling.
 * @author              Jesper Stolt
 */

// External module imports
const mariadb = require('mariadb');

// User built module imports
const utils = require('./utils');
const api = require('./apihandler');

// Import config-file for mariaDB.
const config = require('./config.json');
// Setup tha database element
const pool = mariadb.createPool(config);



let database = {
    /**
     * Talks with the database, through the pool-element and returns the response.
     * @param   {string}    query               The query sent to the database.
     * @param   {array}     [placeholders=[]]   If '?' is used in the query, an array of the placeholders is
     * sent aswell.
     * @returns  {array}                        Returns the response from the database as an array.
     */
    queryToDB: async (query, placeholders=[]) => {
        let conn, rows;
        try {
          	conn = await pool.getConnection();
          	rows = await conn.query(query, placeholders);
            delete rows.meta
        } catch (err) {
      	     throw err;
        } finally {
      	     if (conn) conn.end();
        }
        return rows;
    },

    /**
     * Check if connection is established with correct tables. If not it raises error.
     * @returns  {void}
     */
    checkConnection: async () => {
        let correctTables = [
            'child',
            'created_by',
            'last_modified_by',
            'last_published_by',
            'page',
            'published_by',
            'user'
        ]

        let tables;

        try {
            tables = await database.get.tables();
        } catch (e) {
            throw `Error: ${e.text}\n    Code: ${e.code}\n    SQLState: ${e.sqlState}\n    Errno:${e.errno}`
        } finally {

        }

        if (tables.length <= 0) {
            throw 'Error: Database tables missing!';
        }

        correctTables.forEach((item, i) => {
            if (tables[i][`Tables_in_${config.database}`] !== item) {
                throw `Error: Missing needed table ${item}`;
            }
        });
    },

    // An collection of SELECT requests to the database.
    get: {
        /**
         * Shows the tables of the current database.
         * @returns {array}                     Returns an array of the tables in the database.
         */
        tables: async () => {
            let query = "SHOW TABLES";
            return await database.queryToDB(query);
        },

        /**
         * Shows all rows of a given table.
         * @param   {string}    table           The name of the table you want to get rows from.
         * @returns {array}                     Returns an array of the users in the database.
         */
        allFrom: async (table, searchObject=null) => {
            let placeHolders = [];
            let query = `SELECT * FROM ${table}`

            if (searchObject) {
                let searchString = '';

                Object.keys(searchObject).forEach((key) => {
                    if (searchString.length !== 0) {
                        searchString += ' AND '
                    }
                    searchString += `${key} LIKE ?`
                })
                query += ` WHERE ${searchString}`;
                placeHolders = Object.values(searchObject)
            }
            return await database.queryToDB(query, placeHolders);
        },

        /**
         * Shows a given row of a given table if it exists.
         * @param   {string}    table           The name of the table you want to get rows from.
         * @param   {object}    searchObject    Key is the name of the columns you seach in and value is the
         * search value of the key.
         * @returns {object}                    Returns an object of the row if it exists.
         */
        oneFrom: async (table, searchObject) => {
            let searchString = ""
            Object.keys(searchObject).forEach((key) => {
                if (searchString.length !== 0) {
                    searchString += ' AND '
                }
                searchString += `${key} LIKE ?`
            })
            query = `SELECT * FROM ${table} WHERE ${searchString}`
            return (await database.queryToDB(query, Object.values(searchObject)))[0];
        },
    },
    // An collection of INSERT requests to the database.
    add: {
        /**
         * Add an row to a certain table.
         * @param   {string}    table           The name of the table you want to add an row to.
         * @param   {string}    paramList       The values you want to add to that row.
         * @returns {object}                    Returns an object with information about the INSERT.
         */
        allColumnsTo: async (table, paramList) => {
            let query = `
                INSERT INTO ${table}
                VALUES
                    (${'?, '.repeat(paramList.length).slice(0,-2)})
            `;
            return await database.queryToDB(query, paramList);
        },

        /**
         * Add an row to a certain table, where you specify what columns you want to add.
         * @param   {string}    table           The name of the table you want to add an row to.
         * @param   {object}    paramObject     Key is the name of the columns you want to add and
         * value is the value of that column.
         * @returns {object}                    Returns an object with information about the INSERT.
         */
        certainColumnsTo: async (table, paramObject) => {
            let query = `
                INSERT INTO ${table}
                    (${Object.keys(paramObject).map(key => key)})
                VALUES
                    (${'?, '.repeat(Object.values(paramObject).length).slice(0,-2)})
            `;
            return await database.queryToDB(query, Object.values(paramObject));
        },

        // Checks if the object exists before adding it
        ifNotExists: {
            /**
             * Add an row to the page table if it not exists.
             * @param   {object}    data            The data you want to add.
             * @param   {object}    [html='']       The html-code of the page.
             * @returns {number}                    Returns the id of the page added.
             */
            page: async (data, parent, html='') => {
                let page = await database.get.oneFrom('page', { uri: data.properties.URI});

                if (!page) {
                    await database.add.certainColumnsTo(
                        'page',
                        {
                            jcr_id: data.properties['jcr:uuid'],
                            display_name: data.properties.displayName,
                            parent_id: parent.id,
                            parent_name: parent.name,
                            is_root: (await api.isRootNode(data.properties['jcr:uuid'])) ? 1 : 0,
                            uri: data.properties.URI,
                            url: data.properties.URL,
                            creation_date: utils.toDateTime(data.properties.creationDate),
                            publish_date: utils.toDateTime(data.properties.publishDate),
                            last_modified_date: utils.toDateTime(data.properties.lastModifiedDate),
                            last_publish_date: utils.toDateTime(data.properties.lastPublishDate),
                            html: html,
                            page_object: JSON.stringify(data)
                        }
                    )

                    page = await database.get.oneFrom('page', { uri: data.properties.URI});
                }

                return page.id;
            },

            /**
             * Add an row to the user table if it not exists.
             * @param   {string}    id              The jcr:uuid of the user.
             * @param   {object}    [data=null]       The data you want to add.
             * @returns {number}                    Returns the id of the page added.
             */
            user: async (id, data=null) => {
                let userData = {jcr_id: id}
                let user = await database.get.oneFrom('user', userData)
                if (!user) {
                    if (data) {
                        userData.name = data.displayName;
                        userData.mail = data.mail;
                    }
                    await database.add.certainColumnsTo('user', userData)
                    user = await database.get.oneFrom('user', {jcr_id: id})
                }

                return user.id;
            }
        },

        /**
         * Add an row to all tables needed to construct an page, including page, user and connection tables.
         * @param   {object}    data            The data you want to add.
         * @param   {object}    [html='']       The html-code of the page.
         * @returns {void}
         */
        entry: async (data, parent, html='') => {
            // Add page and get its id
            let pageId = await database.add.ifNotExists.page(data, parent, html);

            // Add users if not exists and get their ids
            let createdById = await database.add.ifNotExists.user(
                data.properties.createdBy.id,
                data.properties.createdBy.properties
            );
            let publishedById = await database.add.ifNotExists.user(
                data.properties.publishedBy.id,
                data.properties.publishedBy.properties
            );
            let lastModifiedById = await database.add.ifNotExists.user(
                data.properties.lastModifiedBy.id,
                data.properties.lastModifiedBy.properties
            );
            let lastPublishedById = await database.add.ifNotExists.user(
                data.properties.lastPublishedBy.id,
                data.properties.lastPublishedBy.properties
            );

            // Add connection between users and pages
            await database.add.allColumnsTo('created_by', [pageId, createdById]);
            await database.add.allColumnsTo('published_by', [pageId, publishedById]);
            await database.add.allColumnsTo('last_modified_by', [pageId, lastModifiedById]);
            await database.add.allColumnsTo('last_published_by', [pageId, lastPublishedById]);

            data.nodes.forEach(async (child) => {
                await database.add.allColumnsTo('child', [
                    pageId,
                    data.properties['jcr:uuid'],
                    child.id
                ]);
            })
        },

        /**
         * Add an row to all tables needed to construct an page, including page, user and connection tables when
         * headless is unusable.
         * @param   {object}    data            The data you want to add.
         * @returns {void}
         */
        entryProperties: async (data, parent) => {
            // Add page and get its id
            let pageId = await database.add.ifNotExists.page(data, parent);

            // Add users if not exists and get their ids
            let createdById = await database.add.ifNotExists.user(data.properties.createdBy);
            let publishedById = await database.add.ifNotExists.user(data.properties.publishedBy);
            let lastModifiedById = await database.add.ifNotExists.user(data.properties.lastModifiedBy);
            let lastPublishedById = await database.add.ifNotExists.user(data.properties.lastPublishedBy);

            // Add connection between users and pages
            await database.add.allColumnsTo('created_by', [pageId, createdById]);
            await database.add.allColumnsTo('published_by', [pageId, publishedById]);
            await database.add.allColumnsTo('last_modified_by', [pageId, lastModifiedById]);
            await database.add.allColumnsTo('last_published_by', [pageId, lastPublishedById]);
        }
    },
}

module.exports = database;
