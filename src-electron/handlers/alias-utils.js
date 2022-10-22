import { readFile } from "fs/promises";

export const parseAlias = async (bw, aliasFile) => {
    let aliasData = await readFile(aliasFile, 'utf8');
    aliasData = JSON.parse(aliasData)
    if(aliasData) {
        console.log(aliasData)
        bw.webContents.send('notify', { type: 'positive', message: 'Alias file loaded successfully' });
    }
    return aliasData;
}