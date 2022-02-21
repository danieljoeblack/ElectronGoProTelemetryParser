let $ = require('jquery')  // jQuery now loaded and assigned to $

const ipcRenderer = require('electron').ipcRenderer;

//startup logic

$(document).ready(function(){
    refreshDropdownClickHandlers()
})

//custom 'select' handler logic
function refreshDropdownClickHandlers(){
    $(".dropdown-item").off("click")
    $(".dropdown-item").on("click",function(){
        var value = $(this).attr("data-value")
        var target = "#"+$(this).attr("data-update-target")
        var label = $(this).text()
    
    
        $(target).text(label)
        $(target).attr("data-value",value)
    })    
}

// Upload form logic

$("#fileUpload").on("submit",function(e){
    sendUploadForm(e)   
    return false 
})

function sendUploadForm(event) {
    (async () => {
        let file = document.getElementById("file").files[0].path;
        const result = await ipcRenderer.invoke('video-uploaded', [file]);
        
        afterFileUpload(result)    
    })();
}

function afterFileUpload(data){
    $(".form-upload").fadeOut(function(){
        $(".form-export").fadeIn(function(){
            //do nothing for now
        })
    })
}

$("#backToUpload").on("click",function(){
    $(".form-export").fadeOut(function(){
        $(".form-upload").fadeIn(function(){
            //do nothing for now
        })
    })
})

$("#optionSelect").on("submit",function(e){
    sendExportForm(e)   
    return false 
})

function sendExportForm(event) {
    (async () => {
        var dataFormat = $("#dataFormatDropdownButton").attr("data-value")
        var deviceKey = $("#deviceDropdownButton").attr("data-value")
        if(dataFormat){
            const result = await ipcRenderer.invoke('export-requested', [dataFormat,deviceKey]);
        
            afterExportCall(result)    
        }
    })();
}

function afterExportCall(result){
    addToast(result.message,3000)
}

//enable tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})