<!DOCTYPE html>
<html>
<head>
	<meta charset=utf-8 />
	<title>Vinyle Player in pure HTML, CSS and JS</title>
	<link rel="stylesheet" href="css/main.css" type="text/css" />
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
	'enable', 'debugMode', 'autoPlay'
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
	<footer>
		<span>Développement : <a href="http://www.amanca.fr/">Aurélien MANCA</a> pour <a href="http://www.le-vinyle.com">Le-vinyle.com</a></span>
		<span>Musique : <a href="http://www.kahvi.org/">Courtoisie de Kahvi Collective</a></span>
	</footer>

	<script src="vendor/raphael-min.js" type="text/javascript"></script>
	<script src="vendor/raphael.free_transform_animate.js" type="text/javascript"></script>
	<script src="js/main.js" type="text/javascript"></script>
	<script type="text/javascript">
		var turntablePlayer = new turntablePlayerEngine();
		window.addEventListener('load', function () {
			turntablePlayer.init(<?php echo json_encode($options); ?>);
		}, false);
	</script>
</body>
</html>