import ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';
import { shell } from 'electron';
import { dialog } from 'electron/remote';

export const loadExcelFile = async (bw, path) => {
  let workbook = await convertToWorkbook(path);
  let bettors = await loadJojoBettors(workbook, bw);
  if (!bettors) return;
  await appendBets(bettors, workbook);
  return bettors;
};

export const compileData = async (bw, mode, path, bettors) => {
  let ogWorkbook = await convertToWorkbook(path);
  let workbook;
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
  } else if (mode === 'new') {
    workbook = new ExcelJS.Workbook();
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

export const crossCheck = async (jojoPath) => {
  console.log('crosscheck', jojoPath);
};

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

async function initializeSummarySheet(workbook) {
  let summarySheet = workbook.addWorksheet('Jojo Personal', {
    views: [{ state: 'frozen', ySplit: 9 }],
  });

  // Table headers
  summarySheet.getRow(9).values = [
    'Day',
    'Bettor',
    'Team',
    'Result',
    'Amount',
    'win/loss',
    'tong',
    'total',
    'comm',
    'comm%',
    'subtotal',
  ];
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

//TODO:
function initializeTestData(player, bet) {
  let winLose = bet.result.includes('lose') ? bet.amount * -1 : bet.amount;
  let tong = bet.result.includes('lose') ? 0 : winLose * player.tong;
  let result = winLose - tong + bet.amount * player.comm;
  let test = {
    day: bet.day,
    name: player.name,
    winLose: winLose,
    subtotal: result,
  };

  //console.log('TESTDATA', rowIndex, test);
  return test;
}

async function appendSummaryData(og, workbook, bettors) {
  let days = loadDays(og).map((day) => day.name.substring(0, 3));
  let rowIndex = 10;
  let sheet = workbook.getWorksheet('Jojo Personal');
  let testData = [];
  // iterate through days (mon, tues, etc)
  days.forEach((day) => {
    // iterate through each player's data (bong daily's bets, etc)
    bettors.forEach((player) => {
      // iterate through each specific player's bet details (amount, etc)
      player.bets.forEach((bet) => {
        if (day == bet.day) {
          // initialize testData for error checking
          testData.push(initializeTestData(player, bet));

          // Initialize each row
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
  sheet.columns.forEach((col) => {
    col.width = 16;
  });
  sheet.columns.forEach((col, i) => {
    if ((i >= 4 && i <= 8) || i == 10) {
      col.width = 22;
    }
  });
  sheet.autoFilter = 'A9:K9';

  // TODO: fix spaghetti error checking
  //console.log('TESTDATA', testData);

  let compareSheet = og.getWorksheet('Jojo summary');

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

  //get player list
  let list = [];
  let pWS = og.getWorksheet('Jojo Bettors');
  pWS.eachRow((row) => {
    if (!!row.getCell(1).value) {
      list.push({ name: row.getCell(1).value });
    }
  });
  //console.log(list);

  let netCompare = compareSheet.getCell(totalsRowIndex, 2).value.result;
  let netCompiled = testData.reduce((total, val) => total + val.subtotal, 0);
  let errorCtr = 2;

  console.log(netCompare, netCompiled);

  //compare values
  if (netCompare == netCompiled) {
    sheet.getCell(1, 1).value = 'No errors found';
  } else {
    sheet.getCell(2, 1).value = 'Error: ';
    sheet.getCell(3, 1).value = 'Correction: ';
    //compare each player's net with compiled data
    list.forEach((player, i) => {
      if (player.name == compareSheet.getRow(i + testRowIndex).getCell(1)) {
        let playerNet = 0;
        testData.forEach((data) => {
          if (data.name == player.name) {
            playerNet += data.subtotal;
          }
        });
        // if compiled data's player net is not = to actual player net, then check player's net per day
        if (
          playerNet !==
          compareSheet.getRow(i + testRowIndex).getCell(2).value.result
        ) {
          for (let day = 5; day <= 11; day++) {
            let dayNet = 0;
            testData.forEach((data) => {
              if (
                data.name == player.name &&
                data.day ==
                  compareSheet.getRow(testRowIndex - 1).getCell(day).value
                    .result
              ) {
                dayNet += data.subtotal;
              }
            });
            if (dayNet != compareSheet.getRow(testRowIndex + i).getCell(day)) {
              sheet.getCell(1, errorCtr).value = `${
                compareSheet.getRow(testRowIndex - 1).getCell(day).value.result
              }, ${player.name}`;
              sheet.getCell(2, errorCtr).value = `${dayNet}`;
              sheet.getCell(3, errorCtr).value = `${
                compareSheet.getRow(testRowIndex + i).getCell(day).value.result
              }`;
              errorCtr++;
            }
          }
        }
      }
    });
  }
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
                bet.team = `${
                  sheet.getRow(rowNum - 2).getCell(1).value
                } / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`;
              } else if (
                sheet.getRow(rowNum).getCell(1).value.match(/over/gi)
              ) {
                bet.team = `${
                  sheet.getRow(rowNum - 3).getCell(1).value
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
