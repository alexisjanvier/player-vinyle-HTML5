/*
* Author:      Marco Kuiper (http://www.marcofolio.net/)
*/
google.load("jquery", "1.3.1");
google.setOnLoadCallback(function()
{
	// Variable to store if the records are spinning
	var playing = false;
	
	// Variable to store if the mouse is down (to enable scratching)
	var mousedown = false;
	
	// Function to be called when the play button is clicked.
	// It changes from "play" to "pause" when records are spinning
	// and starts both the vinyls.
	$("#playbutton").click(function() {
		checkButtons();
		if(playing) {
			// Pause
			$("#playbtn").attr("src", "images/btn-play.png");
			playing = false;
			$(".vinyl").each(function() {
				// Clear the interval from the vinyl
				// to stop spinning
				var intervalHandle = $(this).data('intervalHandle');
				clearInterval(intervalHandle);
				$(this)
					.css({ 'cursor' : 'default' })
					.stop()
					.animate({rotate: '+=40deg'}, 800, 'easeOutCubic');				
			});
		} else {
			// Play
			$("#playbtn").attr("src", "images/btn-pause.png");
			playing = true;
			$(".vinyl").each(function() {
				$(this)
					.css({ 'cursor' : 'move' })
					.data('rotationAngle', 10);
				startSpinning($(this));
			});
		}
	});

	// Handle the "mouseDown" to enable scratching
	// We can't combine "mouseDown" with "mouseMove", so we'll need
	// to set a boolean (mousedown).
	// We're also clearing the intervals to prevent spinning
	$(".vinyl").mousedown(function(e) {
		var intervalHandle = $(this).data('intervalHandle');
		clearInterval(intervalHandle);
		mousedown = true;
	}).mouseup(function() {
		mousedown = false;
		if(playing) {
			startSpinning($(this));
		}
	});
	
	// When mousedown is true and the records are playing,
	// we can scratch the vinyls. This is where the code can be improved,
	// since we only register X-movement
	$(".vinyl").mousemove(function(e){
		if(mousedown && playing) {
			var intervalHandle = $(this).data('intervalHandle');
			clearInterval(intervalHandle);
			$(this).rotate(e.pageX % 360);
		}
	});
	
	// Handlers for each speed button (slow or faster)
	$("#speedbutton1").click(function() {
		if($(this).data('isEnabled')) {
			$("#vinyl1").data('rotationAngle', $("#vinyl1").data('rotationAngle') + 10);
		}
		checkButtons();
	});
	
	$("#slowbutton1").click(function() {
		if($(this).data('isEnabled')) {
			$("#vinyl1").data('rotationAngle', $("#vinyl1").data('rotationAngle') - 10);
		}
		checkButtons();
	});
	
	$("#speedbutton2").click(function() {
		if($(this).data('isEnabled')) {
			$("#vinyl2").data('rotationAngle', $("#vinyl2").data('rotationAngle') + 10);
		}
		checkButtons();
	});
	
	$("#slowbutton2").click(function() {
		if($(this).data('isEnabled')) {
			$("#vinyl2").data('rotationAngle', $("#vinyl2").data('rotationAngle') - 10);
		}
		checkButtons();
	});
	
	/**
	* Start spinning those vinyls by the given element. Set an interval to keep the vinyl spinning
	* and attach it to the element to keep a reference for clearing later.
	**/
	function startSpinning(element) {
		element.stop().animate({rotate: '+=40deg'}, 800, 'easeInCubic', function() {
			var intervalHandle = setInterval(
		 	   function () {
		  	      element.animate({rotate: '+=' + element.data('rotationAngle') + 'deg'}, 0);
		  	  },
		  	  25
			);
			element.data('intervalHandle', intervalHandle);
		});
	}
	
	/**
	* Check if the buttons needs to be changed
	**/
	function checkButtons() {
		if($("#vinyl1").data('rotationAngle') == 0) {
			$("#slowbutton1")
				.data('isEnabled', false)
				.children().attr("src", "images/btn-slow-dis.png");
		} else {
			$("#slowbutton1")
				.data('isEnabled', true)
				.children().attr("src", "images/btn-slow.png");
		}
		
		if($("#vinyl1").data('rotationAngle') == 50) {
			$("#speedbutton1")
				.data('isEnabled', false)
				.children().attr("src", "images/btn-fast-dis.png");
		} else {
			$("#speedbutton1")
				.data('isEnabled', true)
				.children().attr("src", "images/btn-fast.png");
		}
		
		if($("#vinyl2").data('rotationAngle') == 0) {
			$("#slowbutton2")
				.data('isEnabled', false)
				.children().attr("src", "images/btn-slow-dis.png");
		} else {
			$("#slowbutton2")
				.data('isEnabled', true)
				.children().attr("src", "images/btn-slow.png");
		}
		
		if($("#vinyl2").data('rotationAngle') == 50) {
			$("#speedbutton2")
				.data('isEnabled', false)
				.children().attr("src", "images/btn-fast-dis.png");
		} else {
			$("#speedbutton2")
				.data('isEnabled', true)
				.children().attr("src", "images/btn-fast.png");
		}
	}
	
});