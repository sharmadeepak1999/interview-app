$(document).ready(() => {
	$("head").append("<link rel='stylesheet' href='/css/index.css'>")
	setTimeout(() => {
		$("main").css("display", "block")
	}, 500)
})