// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain,dialog} = require('electron')
const path = require('path')
const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require(`gopro-telemetry`);
const fs = require('fs');
const { electron } = require('process');
const csv=require('csvtojson')
const xlsx = require('xlsx')


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./html/index.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

//custom code

var currentTelemetry
var extractedData
var currentFile

//form handlers
ipcMain.handle('video-uploaded', async (event, arg) => {
  //save file reference incase we need to continue processing later (export type change?)
  var currentFile = arg[0]

  //pull the telemetry from the video meta data (stored in global for futher processing / export)
  currentTelemetry = await pullTelemetry(arg[0]);

  return currentTelemetry;
})
ipcMain.handle('export-requested', async (event, arg) => {
  var response = {status:"success",message:"Successfully saved file.",data:{}}

  var dataFormat = arg[0]
  var deviceIndex = arg[1]
  const responsePromise = new Promise((resolve, reject) => {    
    dialog.showSaveDialog({filters:[{name:dataFormat,extensions:[dataFormat]}]}).then(function(result){
      if(!result.canceled){
        if(dataFormat == 'xlsx'){
          goproTelemetry(extractedData, {preset:"csv"}, telemetry => {            
            const wb = xlsx.utils.book_new();
            var worksheets = []
            var sheetsCompleted = 0
            var sheetsTotal = Object.keys(telemetry).length
      
            const myPromise = new Promise((resolve, reject) => {
              Object.keys(telemetry).forEach(stream_key => {                        
                var sheet = telemetry[stream_key]                   
                var tmpstreamkey = stream_key
                csv()
                  .fromString(sheet)
                  .then((jsonObj)=>{     
      
                      var dataRows = [Object.keys(jsonObj[0])]
      
                      for(var i=1;i<jsonObj.length;i++){
                        dataRows.push(Object.values(jsonObj[i]))
                      }
      
                      var ws = xlsx.utils.aoa_to_sheet(dataRows);
                      worksheets.push({ws:ws,name:tmpstreamkey})
      
                      sheetsCompleted++
      
                      if(sheetsCompleted == sheetsTotal){
                        resolve()
                      }
                  })              
              });
            });
      
            myPromise.then(function(){        
                worksheets.sort((a, b) => (a.name > b.name) ? 1 : -1)
                for(var i=0;i<worksheets.length;i++){
                  xlsx.utils.book_append_sheet(wb, worksheets[i].ws, worksheets[i].name);
                }
                xlsx.writeFile(wb, result.filePath);  
                resolve()     
            })          
          });

        }else{
          goproTelemetry(extractedData, {preset:dataFormat}, telemetry => {
            if(dataFormat.indexOf("json") != -1)
              fs.writeFileSync(result.filePath,JSON.stringify(telemetry))
            else
              fs.writeFileSync(result.filePath,telemetry)

              resolve()
          });
        }
      }else{
        response.message = "No file location selected."
        resolve()
      }
    })  
  })

  var foo = await responsePromise

  return response

})

//file processing
function pullTelemetry(path,type){
  return new Promise(resolve=>{
      //default export type to json
      type = type||"json"

      //pull the file at the given path
      const file = fs.readFileSync(path);

      //pass the file to the scraper
      gpmfExtract(file)
      .then(extracted => {
        extractedData = extracted
        goproTelemetry(extracted, {preset:"json"}, telemetry => {
          //return the telemetry data, parsed based on the given type
          resolve(telemetry);
        });
      })
      .catch(error => console.error(error));
  })
}

async function pullAvailableStreamsFromTelemetry(telemetry){
  return Object.keys(telemetry);
}
