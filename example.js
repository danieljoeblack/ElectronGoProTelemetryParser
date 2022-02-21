const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require(`gopro-telemetry`);
const fs = require('fs');
const csv=require('csvtojson')
const xlsx = require('xlsx')

const file = fs.readFileSync("C:\\Users\\danie\\Videos\\GH011071.MP4");

gpmfExtract(file)
  .then(extracted => {
    goproTelemetry(extracted, {preset:"csv"}, telemetry => {            
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
                  resolve("foo")
                }
            })              
        });
      });

      myPromise.then(function(){        
          worksheets.sort((a, b) => (a.name > b.name) ? 1 : -1)
          for(var i=0;i<worksheets.length;i++){
            xlsx.utils.book_append_sheet(wb, worksheets[i].ws, worksheets[i].name);
          }
          xlsx.writeFile(wb, "sheetjs.xlsx");       
      })          
    });
  })
  .catch(error => console.error(error));