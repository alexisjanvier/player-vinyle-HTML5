// Load the player
var turntablePlayer = new turntablePlayerEngine();

window.addEventListener('load', function () {
	turntablePlayer.init();

	// panels
	if (turntablePlayer.options.panels.cover)
		document.getElementById('panel-cover').checked = true;
	else
		document.getElementById('panel-cover').checked = false;

	if (turntablePlayer.options.panels.playlist)
		document.getElementById('panel-playlist').checked = true;
	else
		document.getElementById('panel-playlist').checked = false;

	if (turntablePlayer.options.panels.infos)
		document.getElementById('panel-infos').checked = true;
	else
		document.getElementById('panel-infos').checked = false;

	var infos = ['duration', 'current', 'timer', 'position'];
	for (var i in infos) {
		if (turntablePlayer.options.infos.indexOf(infos[i]) != -1)
			document.getElementById('panel-infos-choice-' + infos[i]).checked = true;
		else
			document.getElementById('panel-infos-choice-' + infos[i]).checked = false;		
	} 

	// mode
	var modes = ['manual', 'automatic'];
	for (var i in modes) {
		if (turntablePlayer.options.mode == modes[i])
			document.getElementById('mode-' + modes[i]).checked = true;
		else
			document.getElementById('mode-' + modes[i]).checked = false;	
	}

	// debug
	if (turntablePlayer.options.debug)
		document.getElementById('debug').checked = true;
	else
		document.getElementById('debug').checked = false;
}, false);

// Load the remote-demo

// mode
var elements = document.querySelectorAll('input[name~=mode-choice]'); 
for (var d in elements) {
	var el = elements.item(d);
	el.addEventListener('click', function (event) {
		turntablePlayer.setOptions({
			mode: event.target.value
		});
	}, false);
}

// debug
document.getElementById('debug').addEventListener('click', function (event) {
	turntablePlayer.setOptions({
		debug: event.target.checked
	});
}, false);

// panel : cover
document.getElementById('panel-cover').addEventListener('click', function (event) {
	turntablePlayer.setOptions({
		panels: { 'cover': event.target.checked }
	});
}, false);

// panel : playlist
document.getElementById('panel-playlist').addEventListener('click', function (event) {
	turntablePlayer.setOptions({
		panels: { 'playlist': event.target.checked }
	});
}, false);

// panel : infos
document.getElementById('panel-infos').addEventListener('click', function (event) {
	turntablePlayer.setOptions({
		panels: { 'infos': event.target.checked }
	});
}, false);

// panel : infos choice
var elements = document.querySelectorAll('input[name~=panel-infos-choice]'); 
for (var d in elements) {
	var el = elements.item(d);
	el.addEventListener('click', function (event) {
		var infos = ['duration', 'current', 'timer', 'position'], display = [];
		function check (i) {
			return document.getElementById('panel-infos-choice-' + i).checked
		}

		for (var j in infos) {
			if (check(infos[j]) == true)
				display.push(infos[j]);
		}

		console.log(display.length, display);

		if (display.length > 0)
			document.getElementById('panel-infos').checked = true;
		else
			document.getElementById('panel-infos').checked = false;

		turntablePlayer.setOptions({
			panels: { 'infos': document.getElementById('panel-infos').checked },
			infos: display
		});
	}, false)
}