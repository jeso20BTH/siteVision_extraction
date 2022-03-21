/**
 * Helping functions used by other programs.
 *
 * @file    This file contains an object of utility functions.
 * @author  Jesper Stolt
 */

let utils = {
    /**
     * Converts ms to an string of date and time.
     * @param   {number}    time    An representation in milliseconds of the time.
     * @returns {string}            Returns the time as an string in the format yyyy-mm-dd hh:mm:ss
     */
    toDateTime: (time) => {
        if (!time) {
            return null;
        }
        date = new Date(time);
        let y = date.getFullYear();
        let m = utils.addZeroLessThanTen(date.getMonth() + 1); //0-11
        let d = utils.addZeroLessThanTen(date.getDate());
        let h = utils.addZeroLessThanTen(date.getHours());
        let mm = utils.addZeroLessThanTen(date.getMinutes());
        let s = utils.addZeroLessThanTen(date.getSeconds());

        return `${y}-${m}-${d} ${h}:${mm}:${s}`
    },

    /**
     * If the value is bellow 10 it adds an zero before it.
     * @param   {number}    value   The number you want to check if it is bellow ten.
     * @returns {string}            Returns the number as an string, with or without an zero before.
     */
    addZeroLessThanTen: (value) => {
        return (value < 10) ? `0${value}` : `${value}`
    }
}

module.exports = utils;
