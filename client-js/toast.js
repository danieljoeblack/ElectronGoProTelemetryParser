function addToast(message,duration) {  
    parentEl = ".toastContainer"
    duration = duration || 3000  
    
    var toastId = "toast-"+Date.now()  
    var appendedELement = $('<div id="'+toastId+'" class="toast">'+message+'</div>').appendTo(parentEl).fadeIn()  
    
    setTimeout(function(){
      $("#"+toastId).fadeOut({complete:function(){
        $("#"+toastId).remove()
      }})
    },duration)
  }
  
  $(document).ready(function(){
    //add toast container if not already on page
    if(!$(".toastContainer").length){
      $('body').append("<div class='toastContainer'></div>")
    }
  })