<!DOCTYPE html>
<html>
<head>
	<meta charset=utf-8 />
	<title>Vinyle Player</title>
	<link rel="stylesheet" href="css/main.css" type="text/css" />
	<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
	<!--[if IE]>
		<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
</head>
<?php 
$options = array();
$keys_string = array(
	'mainId', 'playlistLocation', 'theme'
);
$keys_boolean = array(
	'enable', 'debugMode', 'autoPlay', 'useTransitions', 'useInfos', 'usePlaylist', 'useCover'
);
$keys_int = array(
	'animateDelay'
);
$keys_array = array(
	'infos', 'buttonLabels', 'easing', 'logMethodNames'
);
$keys = array_merge_recursive($keys_string, $keys_boolean, $keys_int, $keys_array);
foreach ($keys as $key)
{
	if (isset($_GET[$key]))
	{
		if (in_array($key, $keys_boolean))
			$options[$key] = filter_var($_GET[$key], FILTER_VALIDATE_BOOLEAN);
		elseif (in_array($key, $keys_int))
			$options[$key] = intval($_GET[$key]);
		elseif (in_array($key, $keys_array))
			$options[$key] = explode(',', $_GET[$key]);
		else
			$options[$key] = $_GET[$key];

		if (is_array($options[$key]))
		{
			foreach ($options[$key] as $k1 => $v1) 
			{
				list($k2, $v2) = explode('|', $options[$key][$k1]);
				if (isset($k2) && isset($v2))
				{
					unset($options[$key][$k1]);
					$options[$key][$k2] = $v2;
				}
			}
		}
	}
}
?>
<body>
	<div id="player"></div>

	<article>
		<h1>Vinyl player</h1>
		<p>Technologies : HTML, CSS, JavaScript and SVG thanks to <a href="http://raphaeljs.com/">Raphaël</a></p>
		<p>All the magic is in <a href="js/turntable-player.js">js/turntable-player.js</a>.</p>
		<p>You can fork this demo at <a href="https://github.com/Le-Vinyle/player-vinyle-HTML5">https://github.com/Le-Vinyle/player-vinyle-HTML5</a>.</p>
		<h2>Examples :</h2>
		<p>You can customize the settings sent to the player through the url, for example :</p>
		<ul>
			<li><a href="index.php">Default options</a></li>
			<li><a href="index.php?autoPlay=true">Automatic turntable</a>
				<br />autoPlay=true</li>
			<li><a href="index.php?theme=alu">ALU theme</a>
				<br />theme=alu</li>
			<li><a href="index.php?playlistLocation=data/playlist2.json">Another playlist</a>
				<br />playlistLocation=data/playlist2.json</li>
			<li><a href="index.php?animateDelay=5000">Change the animation delay to 5 seconds</a>
				<br />animateDelay=5000</li>
			<li><a href="index.php?useInfos=true&infos=duration,current,timer,position">Display the informations panel and choose the track informations</a>
				<br />useInfos=true&infos=duration,current,timer,position</li>
			<li><a href="index.php?usePlaylist=true&useInfos=true">All panels displayed</a>
				<br />usePlaylist=true&useInfos=true</li>
		</ul>
		<h2>All the config settings :</h2>
		<pre>
{
  // Delay for the animations of the arm and the disc
  animateDelay : 2000, 
  // Automatic turntable
  autoPlay : false, 
  // Time in ms when the turntable auto-shutdowns when it turns with no track in manual mode
  autoStop: 60000, 
  // Customize the labels of the buttons
  buttonLabels: { 
    play: 'POWER ON',
    pause: 'POWER OFF'
  },
  // Show log infos
  debugMode : false, 
  // Easing customization
  easing: { 
    start: '<',
    pause: 'cubic-bezier(.81, .79, .57, 1.01)',
    stop: 'cubic-bezier(.81, .79, .57, 1.01)'
  },
  // Load on init
  enable: true, 
  // Force the request to retrieve an updated playlist
  forceDateInUri : true, 
  // Choices : duration, current, timer, position
  infos: ["duration", "timer"], 
  // Log informations in the console
  logMethodNames: ["log", "debug", "warn", "info"],
  // Dom ID to use to build the player, if not found, the element will be created
  playedId: 'player', 
  // Dom ID to use to build the remote, if not found, the element will be created
  remoteId: 'player', 
  // Uri of the playlist in json format
  playlistLocation: '/data/playlist.json', 
  // Display the paper panel
  useCover: true, 
  // Display the informations panel
  useInfos: true, 
  // Display the playlist panel
  usePlaylist: true, 
  // Use audio transition at the beginning and the end of the track
	useTransitions: true, 
}
		</pre>
		<footer>
			<p>Developed by <a href="http://www.amanca.fr/">Aurélien MANCA</a> for <a href="http://www.le-vinyle.com">Le-vinyle.com</a></p>
			<p>Music is courtesy of <a href="http://www.kahvi.org/">Kahvi Collective</a></p>
			<p>Favicon from <a href="http://www.iconfinder.com/icondetails/23864/16/">Oliver Scholtz (and others)</a></p>
			<p>Audio transitions from <a href="http://www.freesound.org/people/schluppipuppie/sounds/13279/">schluppipuppie</a> and <a href="http://www.freesound.org/people/gadzooks/sounds/59985/">gadzooks</a></p>
		</footer>
	</article>

	<script src="vendor/raphael-min.js" type="text/javascript"></script>
	<script src="vendor/raphael.free_transform_animate.js" type="text/javascript"></script>
	<script src="js/turntable-player.js" type="text/javascript"></script>
	<script type="text/javascript">
		var turntablePlayer = new turntablePlayerEngine();
		window.addEventListener('load', function () {
			turntablePlayer.init(<?php echo json_encode($options); ?>);
		}, false);
	</script>
	<script type="text/javascript">
		var _gaq = _gaq || [];
		_gaq.push(['_setAccount', 'UA-17311686-7']);
		_gaq.push(['_trackPageview']);
		(function() {
			var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
			ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		})();
</script>
</body>
</html>