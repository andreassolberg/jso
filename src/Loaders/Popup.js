import BasicLoader from './BasicLoader';

export default class Popup extends BasicLoader {

  execute() {

		console.error("Popup loaded...");
		/*
		* In the popup's scripts, running on <http://example.org>:
		*/
		return new Promise((resolve, reject) => {

			window.addEventListener("message", function(event) {
				console.log("Sent a message to event.origin " + event.origin + " and got the following in response:")
				console.log("<em>" + event.data + "</em>")

	    	var url = newwindow.location.href
	    	console.error("Popup location is ", url, newwindow.location)
        resolve(url)
			});

  		window.popupCompleted = function() {
	    	var url = newwindow.location.href
	    	console.error("Popup location is ", url, newwindow.location)
        resolve(url)
			};

			var newwindow = window.open(this.url, 'uwap-auth', 'height=600,width=800')
      console.log("Newwindow is ", newwindow)
      if (newwindow === null) {
        throw new Error("Error loading popup window")
      }
			if (window.focus) {
				newwindow.focus()
			}

		})
	}
}
