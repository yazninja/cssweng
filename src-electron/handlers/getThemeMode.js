export default function getThemeMode() {
    ipcMain.handle('getThemeMode', async (event) => {
        return nativeTheme.shouldUseDarkColors
    })
}