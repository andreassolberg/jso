import BasicLoader from './BasicLoader';

export default class Popup extends BasicLoader {
	execute() {
		var that = this;
		// console.error("Popup loaded...");

		/*
		* In the popup's scripts, running on <http://example.org>:
		*/
		var p = new Promise(function(resolve, reject) {

			window.addEventListener("message", function(event) {
				console.log("Sent a message to event.origin " + event.origin + " and got the following in response:");
				console.log("<em>" + event.data + "</em>");

		    	var url = newwindow.location.href;
		    	console.error("Popup location is ", url, newwindow.location);
		        resolve(url);

			});
			
			window.popupCompleted = function() {
		    	var url = newwindow.location.href;
		    	console.error("Popup location is ", url, newwindow.location);
		        resolve(url);
			};

			var newwindow = window.open(that.url, 'uwap-auth', 'height=600,width=800');
			if (window.focus) {
				newwindow.focus();
			}

		});
		return p;
	}
}
