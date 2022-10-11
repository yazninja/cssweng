import ExcelJS from 'exceljs'
import { ipcMain } from 'electron';
import { loadDays } from "./loadXlsx.js"
import { dialog } from 'electron/remote';

// SUMMARY SHEET SETUP
async function summarySetup(workbook) {
  let summarySheet = workbook.addWorksheet('AUTOGENERATED SUMMARY', { views: [{ state: 'frozen', ySplit: 9 }] });
  summarySheet.getRow(9).values = ['Day', 'Bettor', 'Team', 'Result', 'Amount', 'win/loss', 'tong', 'total', 'comm', 'com%']
  summarySheet.getRow(8, 9).fill = {
    type: 'pattern',
    pattern: 'solid',
    bgColor: { argb: 'FFFFFF00' },
    fgColor: { argb: "FFFFFF" }
  };

  summarySheet.getCell("E8").value = { formula: "SUM(E10:E1000)" }
  summarySheet.getCell("F8").value = { formula: "SUM(F10:F1000)" }
  summarySheet.getCell("G8").value = { formula: "SUM(G10:G1000)" }
  summarySheet.getCell("H8").value = { formula: "SUM(H10:H1000)" }
  summarySheet.getCell("I8").value = { formula: "SUM(I10:I1000)" }
  summarySheet.getCell("J8").value = { formula: "SUM(H8:I8)" }
  return summarySheet
}

export async function compileData(data) {
  ipcMain.handle('compileData', async (event, data) => {

    data = JSON.parse(data)
    let sheet = await summarySetup(wb2)
    let days = loadDays().map(day => { return day.name })
    let rowIndex = 10
    days.forEach(day => {
      //console.log(data)
      data.forEach(player => {
        player.bets.forEach(bet => {
          if (day == bet.day) {
            // Variables that need calculation / has value based on other cells
            let winLose = bet.result.includes('lose') ? (bet.amount * -1) : (bet.amount)
            let team = (bet.team + " " + bet.teamExtra).includes("undefined") ? bet.team : bet.team + " " + bet.teamExtra
            let tong = bet.result.includes('lose') ? 0 : (winLose * player.tong)
            let total = winLose - tong
            let comm = bet.amount * player.comm
            let result = total + comm

            // Initialize each row
            let rowData = [bet.day, player.name, team, bet.result, bet.amount, winLose, tong, total, comm, player.comm, result]
            sheet.getRow(rowIndex).values = rowData

            // Change com% column values to percentage format
            sheet.getCell(rowIndex, 10).numFmt = '0.00%'

            // move to next row
            rowIndex++
          }
        })
      })
    })
    let now = new Date().toISOString();
    let options = {
      title: "Save Excel File",
      defaultPath : now,
      buttonLabel : "Compile Data",

      filters :[
          {name: 'xlsx', extensions: ['xlsx']}
      ]
  };
    dialog.showSaveDialog(null, options).then(async({ filePath }) => {
      await wb2.xlsx.writeFile(filePath)
    });

    
  })
}

const wb2 = new ExcelJS.Workbook()
