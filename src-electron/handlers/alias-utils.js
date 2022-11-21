import { readFile } from "fs/promises";

/** parseAlias - parses the alias file and returns an array of aliases
    * @param {object} bw - the BrowserWindow object
    * @param {string} aliasFile - the path to the alias file
    * @returns {array} - an array of aliases
*/
export const parseAlias = async (bw, aliasFile) => {
    let aliasData = await readFile(aliasFile, 'utf8');
    aliasData = JSON.parse(aliasData)
    if(aliasData) {
        console.log(aliasData)
        bw.webContents.send('notify', { type: 'positive', message: 'Alias file loaded successfully' });
    }
    return aliasData;
}