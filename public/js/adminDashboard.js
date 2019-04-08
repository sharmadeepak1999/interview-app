$(document).ready(() => {
	$("head").append("<link rel='stylesheet' href='/css/adminDashboard.css'>")
	setTimeout(() => {
		$("main").css("display", "block")
	}, 500)
})