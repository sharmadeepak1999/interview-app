$(document).ready(() => {
	$("head").append("<link rel='stylesheet' href='/css/dashboard.css'>")
	setTimeout(() => {
		$("main").css("display", "block")
	}, 500)
})