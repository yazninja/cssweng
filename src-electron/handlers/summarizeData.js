import ExcelJS from 'exceljs'

export default function summarizeData(data) {
    ipcMain.handle('summarizeData', async (event, data) => {
        data.forEach(sheet => {
          console.log(sheet.name, sheet.rowCount, sheet.columnCount, sheet.state)
        });
      })
}