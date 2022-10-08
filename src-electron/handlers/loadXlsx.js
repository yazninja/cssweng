export function async loadXlsx(path) {
    let excelFile = await readFile(path).catch(err => console.log(err))
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelFile);

    loadPlayers();
    loadDays();
}