$(document).ready(() => {
	$("head").append("<link rel='stylesheet' href='/css/newQuestion.css'>")
	$("head").append("<link href='/css/vendor/videoplayer-css/video-js.min.css' rel='stylesheet'>")
	$("head").append("<link href='/css/vendor/video-css/videojs.record.css' rel='stylesheet'>")
	setTimeout(() => {
		$("main").css("display", "block")
	}, 500)
})