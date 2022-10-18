import ExcelJS from 'exceljs'
import { readFile } from 'fs/promises';
import { shell } from 'electron';
import { dialog } from 'electron/remote';

export const loadExcelFile = async (bw, path) => {
    let workbook = await convertToWorkbook(path)
    let bettors = await loadJojoBettors(workbook, bw)
    if(!bettors) return
    await appendBets(bettors, workbook)
    return bettors
}

export const compileData = async (bw, mode, path, bettors) => {
    let workbook;
    let now = new Date().toISOString().split('T')[0];
    let options = {
        title: 'Save Excel File',
        defaultPath: now,
        buttonLabel: 'Compile Data',
        filters: [{ name: 'xlsx', extensions: ['xlsx'] }]
    };
    if(mode === 'edit'){
        workbook = await convertToWorkbook(path)
        let summarysheet = workbook.getWorksheet('Jojo Personal')
        if (summarysheet) {
            bw.webContents.send('notify', { message: 'Jojo Personal sheet found, overwriting', color: 'warning', timeout: 5000 })
            workbook.removeWorksheet(summarysheet.id)
        }
    }
    else if(mode === 'new') {
        workbook = new ExcelJS.Workbook()
    }
    await initializeSummarySheet(workbook)
    await appendSummaryData(workbook, JSON.parse(bettors))
    if(mode === 'new') {
        dialog.showSaveDialog(bw, options).then(async ({ filePath }) => {
            await workbook.xlsx.writeFile(filePath).then(() => {
                bw.webContents.send('notify', { message: `File saved in ${filePath}`, type: 'positive', timeout: 5000 })
                shell.openExternal(filePath)
            }).catch(err => {
                if (err.code == 'EBUSY') {
                    return bw.webContents.send('notify', { message: 'Can\'t save file, Make sure that it is not OPEN in another program', type: 'negative', timeout: 0, closeBtn })
                }
            })
        })
    }
    else if(mode === 'edit') {
        await workbook.xlsx.writeFile(path).then(() => {
            bw.webContents.send('notify', { message: `File saved in ${path}`, type: 'positive', timeout: 5000 })
            shell.openExternal(path)
        }).catch(err => {
            if (err.code == 'EBUSY') {
                return bw.webContents.send('notify', { message: 'Can\'t save file, Make sure that it is not OPEN in another program', type: 'negative', timeout: 0, closeBtn })
            }
        })
    }
}

export const crossCheck = async (jojoPath) => {
    console.log('crosscheck', jojoPath)
}

export const loadSummary = async (bw, path) => {
    let workbook = await convertToWorkbook(path)
    let summarySheet = workbook.getWorksheet('Summary')
    if (!summarySheet) return bw.webContents.send('notify', {
        type: 'negative',
        message: 'Summary sheet not found',
        timeout: 0,
        noClose: true
    })
    let players=[];
    let columnA = summarySheet.getColumn('A').values.filter((value) => value?.formula?.includes('Bettors Table')).map((value) => value?.result);
    columnA.forEach(p => players.push({name: p, alias: p}))
    return players;
}

async function initializeSummarySheet(workbook) {
    let summarySheet = workbook.addWorksheet('Jojo Personal', { views: [{ state: 'frozen', ySplit: 9 }] })

    // Table headers
    summarySheet.getRow(9).values = ['Day', 'Bettor', 'Team', 'Result', 'Amount', 'win/loss', 'tong', 'total', 'comm', 'comm%', 'subtotal']
    // fonts for every column
    summarySheet.columns.forEach(column => {
        column.font = { name: 'Arial', family: 2, size: 10 };
    })
    // Table headers styles
    summarySheet.getRow(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
    summarySheet.getRow(9).font = { bold: true }
    summarySheet.getRow(9).alignment = { vertical: 'middle', horizontal: 'center' };

    // formulas & styles for row 8 cells
    for (let col of ['E', 'F', 'G', 'H', 'I', 'K']) {
        summarySheet.getCell(`${col}8`).numFmt = '[$₱-3409]#,##0.00'
        if (col != 'J') summarySheet.getCell(`${col}8`).value = { formula: `SUBTOTAL(9,${col}10:${col}1000)` }
        else summarySheet.getCell(`${col}8`).value = { formula: 'SUM(H8,I8)' }
    }

    summarySheet.getRow(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
    summarySheet.getRow(8).font = { name: 'Arial', family: 2, size: 16 };
    summarySheet.getRow(8).alignment = { vertical: 'middle', horizontal: 'center' };

    summarySheet.getRow(8).eachCell({ includeEmpty: true }, (cell, i) => {
        if (i <= 11) {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        }
    })

    return summarySheet
}

async function appendSummaryData(workbook, bettors) {
    let days = loadDays(workbook).map(day => day.name.substring(0,3))
    let rowIndex = 10;
    let sheet = workbook.getWorksheet('Jojo Personal')
    // iterate through days (mon, tues, etc)
    days.forEach(day => {
        // iterate through each player's data (bong daily's bets, etc)
        bettors.forEach(player => {
            // iterate through each specific player's bet details (amount, etc)
            player.bets.forEach(bet => {
                if (day == bet.day) {

                    // Initialize each row
                    let rowData = [bet.day, player.name, bet.team, bet.result, bet.amount,
                    { formula: `IF(D${rowIndex}='win',E${rowIndex},-E${rowIndex})` },
                    { formula: `IF(F${rowIndex}>0,E${rowIndex}*0.1, 0)` },
                    { formula: `F${rowIndex}-G${rowIndex}` },
                    { formula: `E${rowIndex}*J${rowIndex}` },
                    player.comm,
                    { formula: `H${rowIndex}+I${rowIndex}` }
                    ]

                    sheet.getRow(rowIndex).values = rowData

                    //data validation for result column
                    sheet.getCell(rowIndex, 4).dataValidation = {
                        type: 'list',
                        allowBlank: false,
                        formulae: ["'win,lose'"]
                    }

                    //numFmt change to peso & percentage
                    for (let i of [5, 6, 7, 8, 9, 10, 11]) {
                        if (i == 10) { sheet.getCell(rowIndex, i).numFmt = '0.00%' }
                        else { sheet.getCell(rowIndex, i).numFmt = '[$₱-3409]#,##0.00' }
                    }

                    // move to next row
                    rowIndex++
                }
            })
        })
    })
    sheet.columns.forEach(col => { col.width = 16 })
    sheet.columns.forEach((col, i) => { if (i >= 4 && i <= 8 || i == 10) { col.width = 22 } })
    sheet.autoFilter = 'A9:K9'
}

async function loadJojoBettors(workbook, bw) {
    let players = [];
    let playWorksheet = workbook.getWorksheet('Jojo Bettors')
    if (!playWorksheet) return bw.webContents.send('notify', {
        type: 'negative',
        message: 'Jojo Bettors sheet not found',
        timeout: 0,
        noClose: true
    })

    playWorksheet.eachRow(row => {
        if (row._cells[0].value === null) return
        players.push({
            name: row._cells[0].value,
            tong: row._cells[1].value,
            comm: row._cells[2].value,
            bets: []
        })
    })

    return players
}

function loadDays(workbook) {
    let dayWorksheets = [];
    let daysRegex = /\b((mon|tue|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?)\b/gi;
    workbook.eachSheet((sheet, id) =>{
        if ((sheet.name !== undefined) && sheet.name.match(daysRegex)) dayWorksheets.push(workbook.getWorksheet(id))
    })
    return dayWorksheets
}

async function appendBets(bettors, workbook) {
   
    let dayWorksheets = loadDays(workbook)
    dayWorksheets.forEach(sheet => {
        //Get 1st row headers and get only names found in Jojo Bettors sheet (formula uses data from Jojo Bettors)
        let playerRow = sheet.getRow(1).values;
        playerRow = playerRow.filter((value, index) => {
            if (value.formula?.includes('Jojo Bettors')) {
                value.index = index
                return value
            }
        })

        // Copy every players bets into players.bets
        playerRow.forEach(p => {
            bettors.forEach(player => {
                // Matching data from playerRow and players
                if (p.result === player.name) {
                    //Access specific columns belonging to each player based on their index
                    let column = sheet.getColumn(p.index)
                    column.eachCell((cell, rowNum) => {
                        // avoids header row, checks if cell.value is not null and if the cell data is relevant (avoids amount cell if there is no team in same row)
                        if (rowNum > 1 && !!cell.value && !!sheet.getCell(rowNum, 1).value) {
                            let bet = {};
                            bet.day = sheet.name.substring(0, 3);
                            // console.log(sheet.getRow(rowNum).getCell(1).value)
                            if (sheet.getRow(rowNum).getCell(1).value.match(/under/gi)) {
                                bet.team = `${sheet.getRow(rowNum - 2).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
                            }
                            else if (sheet.getRow(rowNum).getCell(1).value.match(/over/gi)) {
                                bet.team = `${sheet.getRow(rowNum - 3).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
                            }
                            else {
                                bet.team = sheet.getRow(rowNum).getCell(1).value
                            }

                            if (bet.team.includes('/')) {
                                bet.team = bet.team.substring(0, 3) + bet.team.substring(bet.team.lastIndexOf(' '), bet.team.length)
                            }
                            if (typeof (cell.value) == 'number') bet.amount = cell.value
                            else bet.amount = cell.value.result
                            bet.result = sheet.getRow(rowNum).getCell(3).value.toLowerCase()
                            player.bets.push(bet)
                        }
                    })
                }
            })
        })
    })
}


async function convertToWorkbook (path) {
    let wb = new ExcelJS.Workbook()
    let excelFile = await readFile(path).catch(err => console.log(err))
    await wb.xlsx.load(excelFile);
    return wb
}