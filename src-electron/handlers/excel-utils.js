import ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';
import { shell, dialog } from 'electron';

export const loadExcelFile = async (bw, path) => {
    let workbook = await convertToWorkbook(path);
    let bettors = await loadJojoBettors(workbook, bw);
    if (!bettors) return;
    await appendBets(bettors, workbook);
    return bettors;
};

export const compileData = async (bw, mode, path, bettors) => {
    let ogWorkbook = await convertToWorkbook(path);
    let workbook = new ExcelJS.Workbook();
    let now = new Date().toISOString().split('T')[0];
    let options = {
        title: 'Save Excel File',
        defaultPath: now,
        buttonLabel: 'Compile Data',
        filters: [{ name: 'xlsx', extensions: ['xlsx'] }],
    };
    if (mode === 'edit') {
        workbook = ogWorkbook;
        let summarysheet = workbook.getWorksheet('Jojo Personal');
        if (summarysheet) {
            bw.webContents.send('notify', {
                message: 'Jojo Personal sheet found, overwriting',
                color: 'warning',
                timeout: 5000,
            });
            workbook.removeWorksheet(summarysheet.id);
        }
    }
    await initializeSummarySheet(workbook);
    await appendSummaryData(ogWorkbook, workbook, JSON.parse(bettors));
    if (mode === 'new') {
        dialog.showSaveDialog(bw, options).then(async ({ filePath }) => {
            await workbook.xlsx
                .writeFile(filePath)
                .then(() => {
                    bw.webContents.send('notify', {
                        message: `File saved in ${filePath}`,
                        type: 'positive',
                        timeout: 5000,
                    });
                    shell.openExternal(filePath);
                })
                .catch((err) => {
                    if (err.code == 'EBUSY') {
                        return bw.webContents.send('notify', {
                            message:
                                "Can't save file, Make sure that it is not OPEN in another program",
                            type: 'negative',
                            timeout: 0,
                            closeBtn,
                        });
                    }
                });
        });
    } else if (mode === 'edit') {
        await workbook.xlsx
            .writeFile(path)
            .then(() => {
                bw.webContents.send('notify', {
                    message: `File saved in ${path}`,
                    type: 'positive',
                    timeout: 5000,
                });
                shell.openExternal(path);
            })
            .catch((err) => {
                if (err.code == 'EBUSY') {
                    return bw.webContents.send('notify', {
                        message:
                            "Can't save file, Make sure that it is not OPEN in another program",
                        type: 'negative',
                        timeout: 0,
                        closeBtn,
                    });
                }
            });
    }
};

export const crossCheck = async (bw, jojoPath, aliases) => {
    console.log("CrossCheck On: ", jojoPath)
    let workbook = await convertToWorkbook(jojoPath)
    let jojoSummaryData = await loadJojoSummary(workbook.getWorksheet('Summary'))
    let weeklySummary = await openWeeklySummary(bw);
    await replaceWithAliases(weeklySummary.data, aliases)
    let crossCheckErrors = await compareData(jojoSummaryData, weeklySummary.data)
    await writeErrors(crossCheckErrors, weeklySummary)
    shell.openExternal(weeklySummary.path);
}

export const loadSummary = async (bw, path) => {
    let workbook = await convertToWorkbook(path);
    let summarySheet = workbook.getWorksheet('Summary');
    if (!summarySheet)
        return bw.webContents.send('notify', {
            type: 'negative',
            message: 'Summary sheet not found',
            timeout: 0,
            noClose: true,
        });
    let players = [];
    let columnA = summarySheet
        .getColumn('A')
        .values.filter((value) => value?.formula?.includes('Bettors Table'))
        .map((value) => value?.result);
    columnA.forEach((p) => players.push({ name: p, alias: p }));
    return players;
};

async function writeErrors(errors, summary) {
    let sheet = summary.wb.getWorksheet('Summary');
    sheet.eachRow((row) => {
        errors.forEach((error) => {

            if (row.getCell('A').value?.formula?.includes('Greed is Good players') && row.getCell('A').value?.result === error.name) {
                console.log(row.getCell('A').value?.result, error.name)
                if (error.net) row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.mon) row.getCell('D').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.tue) row.getCell('E').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.wed) row.getCell('F').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.thu) row.getCell('G').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.fri) row.getCell('H').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.sat) row.getCell('I').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
                if (error.sun) row.getCell('J').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } }
            }
            else {
                delete(row.getCell('C').fill)
            }
        })
    });
    await summary.wb.xlsx.writeFile(summary.path);

    return summary;
}

async function compareData(jSummary, wSummary) {
    let errors = [];

    jSummary.forEach((jPlayer) => {
        let wPlayer = wSummary.get(jPlayer.name);
        if (wPlayer) {
            let e = {};
            for (let jProperty in jPlayer) {
                if (jPlayer[jProperty] !== wPlayer[jProperty]) {
                    e.name = jPlayer.name
                    e[jProperty] = jPlayer[jProperty] - wPlayer[jProperty]
                }
            }
            if (e.name) errors.push(e)
        }
    })
    return errors;
}

async function replaceWithAliases(summary, aliases) {
    let aliasList = JSON.parse(aliases)

    aliasList.forEach(alias => {
        if (alias.alias.includes(", ")) {
            let tAlias = alias.alias.split(", ")
            let tSummary = {};
            tAlias.forEach(a => {
                if (summary.has(a)) {
                    tSummary.name = alias.name
                    tSummary.net = tSummary.net + summary.get(a).net
                    tSummary.mon = tSummary.mon + summary.get(a).mon
                    tSummary.tue = tSummary.tue + summary.get(a).tue
                    tSummary.wed = tSummary.wed + summary.get(a).wed
                    tSummary.thu = tSummary.thu + summary.get(a).thu
                    tSummary.fri = tSummary.fri + summary.get(a).fri
                    tSummary.sat = tSummary.sat + summary.get(a).sat
                    tSummary.sun = tSummary.sun + summary.get(a).sun
                    summary.delete(a)
                }
            })
        }
        else if (summary.has(alias.alias)) {
            let tSummary = summary.get(alias.alias)
            summary.delete(alias.name)
            tSummary.name = alias.name
            summary.set(tSummary.name, tSummary)
        }
    })
    return summary
}

async function initializeSummarySheet(workbook) {
    let summarySheet = workbook.addWorksheet('Jojo Personal', {
        views: [{ state: 'frozen', ySplit: 9 }],
    });

    // Table headers
    summarySheet.getRow(9).values = ['Day', 'Bettor', 'Team', 'Result', 'Amount', 'win/loss', 'tong', 'total', 'comm', 'comm%', 'subtotal'];
    // fonts for every column
    summarySheet.columns.forEach((column) => {
        column.font = { name: 'Arial', family: 2, size: 10 };
    });
    // Table headers styles
    summarySheet.getRow(9).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF00' },
    };
    summarySheet.getRow(9).font = { bold: true };
    summarySheet.getRow(9).alignment = {
        vertical: 'middle',
        horizontal: 'center',
    };

    // formulas & styles for row 8 cells
    for (let col of ['E', 'F', 'G', 'H', 'I', 'K']) {
        summarySheet.getCell(`${col}8`).numFmt = '[$₱-3409]#,##0.00';
        if (col != 'J')
            summarySheet.getCell(`${col}8`).value = {
                formula: `SUBTOTAL(9,${col}10:${col}1000)`,
            };
        else summarySheet.getCell(`${col}8`).value = { formula: 'SUM(H8,I8)' };
    }

    summarySheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF00' },
    };
    summarySheet.getRow(8).font = { name: 'Arial', family: 2, size: 16 };
    summarySheet.getRow(8).alignment = {
        vertical: 'middle',
        horizontal: 'center',
    };

    summarySheet.getRow(8).eachCell({ includeEmpty: true }, (cell, i) => {
        if (i <= 11) {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        }
    });

    return summarySheet;
}

async function loadJojoSummary(summarySheet) {
    let summary = new Map();
    summarySheet.eachRow((row) => {
        if (row.getCell('A').value?.formula?.includes('Bettors Table')) {
            let bettor = {
                name: row.getCell('A').value.result,
                net: row.getCell('B').value.result || 0,
                mon: row.getCell('E').value.result || 0,
                tue: row.getCell('F').value.result || 0,
                wed: row.getCell('G').value.result || 0,
                thu: row.getCell('H').value.result || 0,
                fri: row.getCell('I').value.result || 0,
                sat: row.getCell('J').value.result || 0,
                sun: row.getCell('K').value.result || 0,
            };
            summary.set(bettor.name, bettor);
        }
    });
    return summary;
}

/** openWeeklySummary - opens the weekly summary
 *
 * @param {*} bw - the browser window object
 */
async function openWeeklySummary(bw) {
    let workbook;
    let summary;
    let fPath;
    let options = {
        title: 'Open Weekly Summary Sheet',
        buttonLabel: 'Cross-Check Data',
        filters: [{ name: 'Microsoft Excel Worksheet', extensions: ['xlsx'] }],
    };

    await dialog.showOpenDialog(bw, options).then(async ({ filePaths }) => {
        fPath = filePaths[0];
        workbook = await convertToWorkbook(filePaths[0]);
        let summarySheet = workbook.getWorksheet('Summary');
        summary = await loadWeeklySummary(summarySheet);
    });
    return { path: fPath, wb: workbook, data: summary };
}
/** loadWeeklySummary - loads the weekly summary data
 *
 * @param {Object} summarySheet - the summary sheet object
 */
async function loadWeeklySummary(summarySheet) {
    let summary = new Map();
    summarySheet.eachRow((row) => {
        if (row.getCell('A').value?.formula?.includes('Greed is Good players')) {
            let bettor = {
                name: row.getCell('A').value.result,
                net: row.getCell('C').value.result || 0,
                mon: row.getCell('D').value.result || 0,
                tue: row.getCell('E').value.result || 0,
                wed: row.getCell('F').value.result || 0,
                thu: row.getCell('G').value.result || 0,
                fri: row.getCell('H').value.result || 0,
                sat: row.getCell('I').value.result || 0,
                sun: row.getCell('J').value.result || 0,
            };
            summary.set(bettor.name, bettor);
        }
    });
    return summary;
}

function initializeData(player, bet, mode) {
    // mode = 0 : error checking mode
    // mode > 0 : summary data initializing mode
    if (mode == 0) {
        let winLose = bet.result.includes('win') ? bet.amount : bet.amount * -1;
        let tong = bet.result.includes('win') ? winLose * player.tong : 0;
        let result = winLose - tong + bet.amount * player.comm;
        let test = {
            day: bet.day,
            name: player.name,
            winLose: winLose,
            subtotal: result,
        };

        return test;
    } else if (mode > 0) {
        let rowIndex = mode;

        let rowData = [
            bet.day,
            player.name,
            bet.team,
            bet.result,
            bet.amount,
            { formula: `IF(D${rowIndex}="win",E${rowIndex},-E${rowIndex})` },
            { formula: `IF(F${rowIndex}>0,E${rowIndex}*${player.tong}, 0)` },
            { formula: `F${rowIndex}-G${rowIndex}` },
            { formula: `E${rowIndex}*J${rowIndex}` },
            player.comm,
            { formula: `H${rowIndex}+I${rowIndex}` },
        ];

        return rowData;
    }
    return 'error in compiling data';
}

export const checkErrors = async (bw, path, bettors) => {
    let og = await convertToWorkbook(path);
    let days = loadDays(og).map((day) => day.name.substring(0, 3));
    let compareSheet = og.getWorksheet('Jojo summary');
    if (!compareSheet) {
        return bw.webContents.send('notify', {
            type: 'negative',
            message: 'Jojo summary sheet not found',
            timeout: 0,
            noClose: false,
        });
    }
    let playerData = [];
    let errorList = [];

    days.forEach((day) => {
        JSON.parse(bettors).forEach((player) => {
            player.bets.forEach((bet) => {
                if (day == bet.day) {
                    playerData.push(initializeData(player, bet, 0));
                }
            });
        });
    });
    //console.log(playerData);

    // look for headers & totals row
    let totalsRowIndex, testRowIndex;
    compareSheet.eachRow((row, i) => {
        if (!!row.getCell(1).value && typeof row.getCell(1).value == 'string') {
            if (row.getCell(1).value.match(/total/gi)) {
                totalsRowIndex = i;
            }
        } else if (
            !!row.getCell(2).value &&
            typeof row.getCell(2).value == 'string'
        ) {
            if (row.getCell(2).value.match(/net/gi)) {
                testRowIndex = i + 1;
            }
        }
    });

    let players = await loadJojoBettors(og, bw);

    let netActual = compareSheet.getCell(totalsRowIndex, 2).value.result;
    let netCompiled = playerData.reduce((total, val) => total + val.subtotal, 0);

    //console.log(netActual, netCompiled);

    //compare values
    if (netActual !== netCompiled) {
        players.forEach((player, i) => {
            if (player.name == compareSheet.getRow(i + testRowIndex).getCell(1)) {
                let playerNet = playerData.reduce((sum, data) => {
                    return data.name == player.name ? sum + data.subtotal : sum;
                }, 0);

                if (
                    playerNet !==
                    compareSheet.getRow(i + testRowIndex).getCell(2).value.result
                ) {
                    for (let day = 5; day <= 11; day++) {
                        let day_winlose = playerData.reduce((sum, data) => {
                            return data.name == player.name &&
                                data.day ==
                                compareSheet.getRow(testRowIndex - 1).getCell(day).value
                                    .result
                                ? sum + data.subtotal
                                : sum;
                        }, 0);

                        if (
                            day_winlose != compareSheet.getRow(testRowIndex + i).getCell(day)
                        ) {
                            let error = {
                                day: compareSheet.getRow(testRowIndex - 1).getCell(day).value
                                    .result,
                                name: player.name,
                                day_winlose: day_winlose,
                                actual_winlose: compareSheet
                                    .getRow(testRowIndex + i)
                                    .getCell(day).value.result,
                            };
                            errorList.push(error);
                        }
                    }
                }
            }
        });
        bw.webContents.send('notify', {
            message: 'Data mismatch detected.',
            color: 'warning',
        });
    }
    console.log('ERRORS: ' + JSON.stringify(errorList));
    return errorList;
};

<<<<<<< HEAD
async function appendSummaryData(og, workbook, bettors) {
    let days = loadDays(og).map((day) => day.name.substring(0, 3));
    let rowIndex = 10;
    let sheet = workbook.getWorksheet('Jojo Personal');
    // iterate through days (mon, tues, etc)
    days.forEach((day) => {
        // iterate through each player's data (bong daily's bets, etc)
        bettors.forEach((player) => {
            // iterate through each specific player's bet details (amount, etc)
            player.bets.forEach((bet) => {
                if (day == bet.day) {
                    // Initialize each row
                    let rowData = initializeData(player, bet, rowIndex);
=======
async function appendSummaryData(og, workbook, bettors, errors) {
  let days = loadDays(og).map((day) => day.name.substring(0, 3));
  let rowIndex = 10;
  let sheet = workbook.getWorksheet('Jojo Personal');
  // iterate through days (mon, tues, etc)
  days.forEach((day) => {
    // iterate through each player's data (bong daily's bets, etc)
    bettors.forEach((player) => {
      // iterate through each specific player's bet details (amount, etc)
      player.bets.forEach((bet) => {
        if (day == bet.day) {
          // Initialize each row
          let rowData = initializeData(player, bet, rowIndex);
>>>>>>> 26a113c0bfbad0ee3b4142b269e66e7be42004e8

                    //console.log('ROW DATA', rowIndex, rowData);
                    sheet.getRow(rowIndex).values = rowData;

                    //data validation for result column
                    sheet.getCell(rowIndex, 4).dataValidation = {
                        type: 'list',
                        allowBlank: false,
                        formulae: ['"win, lose"'],
                    };

                    //numFmt change to peso & percentage
                    for (let i of [5, 6, 7, 8, 9, 10, 11]) {
                        if (i == 10) {
                            sheet.getCell(rowIndex, i).numFmt = '0.00%';
                        } else {
                            sheet.getCell(rowIndex, i).numFmt = '[$₱-3409]#,##0.00';
                        }
                    }

                    // move to next row
                    rowIndex++;
                }
            });
        });
    });
<<<<<<< HEAD
    sheet.columns.forEach((col) => {
        col.width = 16;
    });
    sheet.columns.forEach((col, i) => {
        if ((i >= 4 && i <= 8) || i == 10) {
            col.width = 22;
        }
    });
    sheet.autoFilter = 'A9:K9';
=======
  });
  sheet.columns.forEach((col) => {
    col.width = 16;
  });
  sheet.columns.forEach((col, i) => {
    if ((i >= 4 && i <= 8) || i == 10) {
      col.width = 22;
    }
  });
  sheet.autoFilter = 'A9:K9';

  if (errors.length > 0) {
    sheet.getCell(1, 1).value = 'Errors: ';
    errors.forEach((error, i) => {
      sheet.getCell(i+1, 2).value = `${error.name} - ${error.day}`
    })
  }
>>>>>>> 26a113c0bfbad0ee3b4142b269e66e7be42004e8
}

async function loadJojoBettors(workbook, bw) {
    let players = [];
    let playWorksheet = workbook.getWorksheet('Jojo Bettors');
    if (!playWorksheet)
        return bw.webContents.send('notify', {
            type: 'negative',
            message: 'Jojo Bettors sheet not found',
            timeout: 0,
            noClose: true,
        });

    playWorksheet.eachRow((row) => {
        if (row._cells[0].value === null) return;
        players.push({
            name: row._cells[0].value,
            tong: row._cells[1].value,
            comm: row._cells[2].value,
            bets: [],
        });
    });

    return players;
}

function loadDays(workbook) {
    let dayWorksheets = [];
    let daysRegex = /\b((mon|tue|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?)\b/gi;
    workbook.eachSheet((sheet, id) => {
        if (sheet.name !== undefined && sheet.name.match(daysRegex))
            dayWorksheets.push(workbook.getWorksheet(id));
    });
    return dayWorksheets;
}

async function appendBets(bettors, workbook) {
    let dayWorksheets = loadDays(workbook);
    dayWorksheets.forEach((sheet) => {
        //Get 1st row headers and get only names found in Jojo Bettors sheet (formula uses data from Jojo Bettors)
        let playerRow = sheet.getRow(1).values;
        playerRow = playerRow.filter((value, index) => {
            if (value.formula?.includes('Jojo Bettors')) {
                value.index = index;
                return value;
            }
        });

        // Copy every players bets into players.bets
        playerRow.forEach((p) => {
            bettors.forEach((player) => {
                // Matching data from playerRow and players
                if (p.result === player.name) {
                    //Access specific columns belonging to each player based on their index
                    let column = sheet.getColumn(p.index);
                    column.eachCell((cell, rowNum) => {
                        // avoids header row, checks if cell.value is not null and if the cell data is relevant (avoids amount cell if there is no team in same row)
                        if (
                            rowNum > 1 &&
                            !!cell.value &&
                            !!sheet.getCell(rowNum, 1).value
                        ) {
                            let bet = {};
                            bet.day = sheet.name.substring(0, 3);
                            // console.log(sheet.getRow(rowNum).getCell(1).value)
                            if (sheet.getRow(rowNum).getCell(1).value.match(/under/gi)) {
                                bet.team = `${sheet.getRow(rowNum - 2).getCell(1).value
                                    } / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`;
                            } else if (
                                sheet.getRow(rowNum).getCell(1).value.match(/over/gi)
                            ) {
                                bet.team = `${sheet.getRow(rowNum - 3).getCell(1).value
                                    } / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`;
                            } else {
                                bet.team = sheet.getRow(rowNum).getCell(1).value;
                            }

                            if (bet.team.includes('/')) {
                                bet.team =
                                    bet.team.substring(0, 3) +
                                    bet.team.substring(
                                        bet.team.lastIndexOf(' '),
                                        bet.team.length
                                    );
                            }
                            if (typeof cell.value == 'number') bet.amount = cell.value;
                            else bet.amount = cell.value.result;
                            bet.result = sheet.getRow(rowNum).getCell(3).value.toLowerCase();
                            player.bets.push(bet);
                        }
                    });
                }
            });
        });
    });
}

async function convertToWorkbook(path) {
    let wb = new ExcelJS.Workbook();
    let excelFile = await readFile(path).catch((err) => console.log(err));
    await wb.xlsx.load(excelFile);
    return wb;
}
