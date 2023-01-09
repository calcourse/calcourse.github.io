// New API socket
let debugMode = false;  // FIXME: Set to true to enable debug mode

let api = "https://j2xnmuiw4k.execute-api.us-west-1.amazonaws.com/CalCourse";
let cookiesLoaded = false;
let helpLoaded = false;
let hoverTimer;
let hoverDelay = 50;
let allTerms = new Set();

$(() => {
	if (/micromessenger/.test(navigator.userAgent.toLowerCase())) {
		$("#wechat-message").removeClass("hidden");
		return;
	}

	$("#login-wrapper").removeClass("hidden");

	$("#email-code-button").on("click", sendEmailCode);

	$("#email-login-button").on("click", onEmailSignIn);

	$("#search-input").on("input", () => {
		filter();
	});

	$(".about-toggle").on("click", () => {
		$("#about-container").toggleClass("hidden");
	});

	$(".cookies-toggle").on("click", () => {
		if (!cookiesLoaded) {
			$("#cookies-page-container").load("policy.html");
			cookiesLoaded = true;
		}
		$("#cookies-container").toggleClass("hidden");
	});

	$(".help-toggle").on("click", () => {
		if (!helpLoaded) {
			$("#help-page-container").load("help.html");
			cookiesLoaded = true;
		}
		$("#help-container").toggleClass("hidden");
	});

	$(".auth-option").on("click", () => {
		errorRestore("我们需要验证你的学生身份");
	});

	$.urlParam = (name) => {
		let results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
			window.location.href
		);
		if (results && results.length >= 2) {
			return results[1] || 0;
		}
	};

	if ($.urlParam("timeout")) {
		$("#login-wrapper>div:first-child").text("会话过期, 请重新登陆。");
	}

	let token = readUserToken();
	let email = readUserEmail();
  if (token && email) {
    if (email.endsWith(".edu")) {
      if (checkValidToken()) {
			loadCourses(email, token);
		  }
    }
	}
});

let ids = [];

let entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
	"/": "&#x2F;",
	"`": "&#x60;",
	"=": "&#x3D;",
};

let COUNTDOWN_INI = 60;
let COUNTDOWN_CUR = 60;
let USER_EMAIL = "";
let USER_CODE = "";

function parseJwt(token) {
	var base64Url = token.split(".")[1];
	var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	var jsonPayload = decodeURIComponent(
		atob(base64)
			.split("")
			.map(function (c) {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join("")
	);
	return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
	let parsed_response = parseJwt(response.credential);
	let verified = parsed_response["email_verified"];
  let email_address = parsed_response["email"];
	let user_name = parsed_response["name"];
	$.ajax({
		url:
			api +
			"/email/verify_google_email/" +
			email_address +
			"/" +
			verified +
			"/" +
			user_name,
		type: "POST",
		success: (response) => {
			console.log(response);

			let access_token = response["access_token"];

			saveDataToLocalStorage(email_address, access_token);
			loadCourses(email_address, access_token);
		},
		error: (response) => {
			console.log(response);
			if (
				email_address.endsWith("@berkeley.edu") ||
				email_address.endsWith("@USC.edu")
			) {
				errorAlert("服务器错误, 请稍后重试");
			} else {
				errorAlert("请换用edu结尾账号登录");
			}
		},
	});
}

function errorAlert(msg) {
	let login_description = $("#login-description");
	login_description.text("\u26A0" + "\n" + msg);
	login_description.css("color", "#FBEC5D");
	login_description.addClass("shake").on("animationend", function (e) {
		$(this).removeClass("shake").off("animationend");
	});
}

function errorRestore(msg) {
	let login_description = $("#login-description");
	login_description.text(msg);
	login_description.css("color", "#FFFFFF");
}

function toggleEmailColor(e_button, g_button) {
	e_button.css("background-color", "#DA8388");
	e_button.css("color", "#FFFFFF");
	g_button.css("background-color", "#333");
	g_button.css("color", "#DA8388");
}

function toggleGoogleColor(e_button, g_button) {
	g_button.css("background-color", "#DA8388");
	g_button.css("color", "#FFFFFF");
	e_button.css("background-color", "#333");
	e_button.css("color", "#DA8388");
}

function toggleEmailAuth() {
	if ($("#google-login-radio").is(":checked")) {
		$("#google-auth-wrapper").slideUp(200, function () {
			$("#email-auth-wrapper").slideDown(300);
		});
		errorRestore("我们需要验证你的学生身份");
	} else {
		$("#email-auth-wrapper").slideDown(300);
	}
	let e_button = $(
		'.auth-option-wrapper > .auth-option[for="email-login-radio"]'
	);
	let g_button = $(
		'.auth-option-wrapper > .auth-option[for="google-login-radio"]'
	);
	e_button.off("mouseenter mouseleave");
	g_button.off("mouseenter mouseleave");
	e_button.hover(
		function (e) {
			toggleEmailColor(e_button, g_button);
		},
		function () {
			toggleEmailColor(e_button, g_button);
		}
	);
	g_button.hover(
		function () {
			clearTimeout(hoverTimer);
			hoverTimer = setTimeout(function () {
				toggleGoogleColor(e_button, g_button);
			}, hoverDelay);
		},
		function () {
			clearTimeout(hoverTimer);
			toggleEmailColor(e_button, g_button);
		}
	);
	toggleEmailColor(e_button, g_button);
}

function toggleGoogleAuth() {
	if ($("#email-login-radio").is(":checked")) {
		$("#email-auth-wrapper").slideUp(200, function () {
			$("#google-auth-wrapper").slideDown(300);
		});
		errorRestore("我们需要验证你的学生身份");
	} else {
		$("#google-auth-wrapper").slideDown(300);
	}
	let e_button = $(
		'.auth-option-wrapper > .auth-option[for="email-login-radio"]'
	);
	let g_button = $(
		'.auth-option-wrapper > .auth-option[for="google-login-radio"]'
	);
	e_button.off("mouseenter mouseleave");
	g_button.off("mouseenter mouseleave");
	e_button.hover(
		function (e) {
			clearTimeout(hoverTimer);
			hoverTimer = setTimeout(function () {
				toggleEmailColor(e_button, g_button);
			}, hoverDelay);
		},
		function () {
			clearTimeout(hoverTimer);
			toggleGoogleColor(e_button, g_button);
		}
	);
	g_button.hover(
		function () {
			toggleGoogleColor(e_button, g_button);
		},
		function () {
			toggleGoogleColor(e_button, g_button);
		}
	);
	toggleGoogleColor(e_button, g_button);
}

function toggleGoogleAuthDisabled() {
	errorAlert("当前浏览器不支持Google登录");
}

async function sendEmailCode() {
	let emailInput = $("#email-input").val();
	let emailReg = new RegExp("^[A-Za-z0-9._-]+@(?:berkeley|USC).edu$");
	if (!emailInput) {
		errorAlert("请填写edu结尾邮箱地址");
	} else if (!emailReg.test(emailInput)) {
		errorAlert("邮箱格式不正确, 请填写edu结尾邮箱地址");
	} else {
		$("#email-code-button").hide();
		$("#email-code-ani").show();
    USER_EMAIL = emailInput;
		let form = new FormData();
		form.append("email", USER_EMAIL);
		$.ajax({
			url: api + "/email/send_verification_code/" + USER_EMAIL,
			type: "POST",
			processData: false,
			contentType: false,
			success: (response) => {
				$("#email-code-ani").hide();
				$("#email-code-button").show();
				sendEmailCodeCountDown();
				errorRestore("请查收并填写邮箱验证码");
				console.log(response);
			},
			error: (response) => {
				console.log(response);
				$("#email-code-ani").hide();
				$("#email-code-button").show();
				sendEmailCodeCountDown();
				errorAlert("无法发送验证码到该邮箱, 请重试");
			},
		});
	}
}

function sendEmailCodeCountDown() {
	const sendEmailCodeButton = $("#email-code-button");
	if (COUNTDOWN_CUR === 0) {
		sendEmailCodeButton.css("cursor", "pointer");
		sendEmailCodeButton.css("color", "");
		sendEmailCodeButton.html("<span>获取</span>");
		$("#email-code-button").on("click", sendEmailCode);
		COUNTDOWN_CUR = COUNTDOWN_INI;
	} else {
		sendEmailCodeButton.css("cursor", "default");
		sendEmailCodeButton.css("color", "#707070");
		sendEmailCodeButton.html("<span>" + COUNTDOWN_CUR + "</span>");
		if (COUNTDOWN_CUR === COUNTDOWN_INI) {
			$("#email-code-button").off("click");
		}
		COUNTDOWN_CUR -= 1;
		setTimeout(function () {
			sendEmailCodeCountDown();
		}, 1000);
	}
}
function onEmailSignIn() {
	let codeInput = $("#email-code-input").val();
	let codeReg = new RegExp("^[0-9]{6}$");
	if (!USER_EMAIL) {
		errorAlert("请先获取验证码");
	} else if (!codeInput) {
		errorAlert("请填写验证码");
	} else if (!codeReg.test(codeInput)) {
		errorAlert("验证码格式不正确");
	} else {
		$("#email-login-button").hide();
		$("#email-login-ani").show();
		USER_CODE = String(codeInput);

		$.ajax({
			url:
				api +
				"/email/verify_authentication_code/" +
				USER_EMAIL +
				"/" +
				USER_CODE,
			type: "POST",
			processData: false,
			contentType: false,
			success: (response) => {
				console.log(response);

				$("#email-login-ani").hide();
				$("#email-login-button").show();

				let access_token = response["access_token"];
				saveDataToLocalStorage(USER_EMAIL, access_token);
				loadCourses(USER_EMAIL, access_token);
			},
			error: (response) => {
				console.log(response);
				$("#email-login-ani").hide();
				$("#email-login-button").show();
				errorAlert("验证失败, 请重试");
			},
		});
	}
}

function escapeHtml(string) {
	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
		return entityMap[s];
	});
}

function addCard(id, name, url, term, school) {
	let newCard;
	ids.push(id);
	// let lastSpace = name.lastIndexOf(" ");
	// let codePart = escapeHtml(
	//   lastSpace == -1 ? "" : name.substring(0, lastSpace)
	// );
	// let numPart = escapeHtml(name.substring(lastSpace + 1, name.length));
	// newCard = $(
	//   `<div class="card" data-id="${id}" data-name="${name}"
	//                        data-url="${url}" data-term="${term}">
	//         <div class="id-wrapper">
	//             <div class="id">
	//                 <span>
	//                     ${codePart} <span>${numPart}</span>
	//                 </span>
	//             </div>
	//         </div>
	//         <div class="qrcode"></div>
	//         <div class="desc">${escapeHtml(id)}</div>
	//     </div>`
	// );
	if (
		school === "USC" ||
		term === "专业群" ||
		term === "学术资源" ||
		term === "Cal Life"
	) {
		newCard = $(
			`<div class="card" data-id="${id}" data-name="${name}"
                           data-url="${url}" data-term="${term}">
				<div class="id-wrapper">
					<div class="id">
						<span>
							${name}
						</span>
					</div>
				</div>
				<div class="qrcode"></div>
				<div class="desc"></div>
				</div>`
		);
	} else {
		let lastSpace = name.lastIndexOf(" ");
		let codePart = escapeHtml(
			lastSpace == -1 ? "" : name.substring(0, lastSpace)
		);
		let numPart = escapeHtml(name.substring(lastSpace + 1, name.length));
		newCard = $(
			`<div class="card" data-id="${id}" data-name="${name}"
                           data-url="${url}" data-term="${term}">
            <div class="id-wrapper">
                <div class="id">
                    <span>
                        ${codePart} <span>${numPart}</span>
                    </span>
                </div>
            </div>
            <div class="qrcode"></div>
            <div class="desc">${escapeHtml(id)}</div>
        </div>`
		);
	}
	$("#card-container").append(newCard);

	newCard.on("mouseenter", cardEnter);
	newCard.on("mouseleave", cardLeave);
	if (name === "Coding Lounge") {
		newCard.on("click", () => {
			location.href =
				"https://www.signupgenius.com/go/10c0f4fafa828abffc07-116";
		});
	} else {
		newCard.on("click", cardClick);
	}
}

function cardEnter(e) {
	let x = $(e.currentTarget);
	if (x.data("timer")) {
		clearTimeout(x.data("timer"));
		x.data("timer", null);
	} else {
		new QRCode(x.find(".qrcode")[0], {
			text: x.data("url"),
			colorDark: "#333333",
			colorLight: "#da8388",
			correctLevel: QRCode.CorrectLevel.H,
		});
	}
}

function cardLeave(e) {
	let x = $(e.currentTarget);
	x.data(
		"timer",
		setTimeout(() => {
			x.find(".qrcode").html("");
			x.data("timer", null);
		}, 2000)
	);
}

function cardClick(e) {
	alert(
		"请保存图片, 在微信扫一扫中选择相册打开。\n如果二维码显示“群已满”, 请联系管理员Hans拉你进群 (微信号username__null)。微信群人数超过200人后二维码就失效了, 暂时无解, 对此造成的不便深表歉意。\n\n请不要把任何CalCourse上的群二维码发到任何群内, 只给他们CalCourse的链接即可, 防止代写跳过CalCourse的身份验证直接扫码加群.\n谢谢配合!"
	);
	let img = $(e.currentTarget).find("img").attr("src");
	// img = img.substring(img.indexOf(",") + 1);
	window.location.href = img;
}

function filter() {
	substring = $("#search-input").val().toLowerCase();
	let term = $("input[type='radio']:checked").data("term");
	for (let id of ids) {
		let card = $(`.card[data-id="${id}"]`);
		if (
			term !== card.data("term") ||
			(String(id).indexOf(substring) == -1 &&
				card.data("name").toLowerCase().indexOf(substring) == -1)
		) {
			card.addClass("hidden");
		} else {
			card.removeClass("hidden");
		}
	}
}

function parseTerm(x) {
	x = x.substring(4);
  	switch (x) {
		case "Lf01":
			return "Cal Life";
		case "Mj01":
			return "专业群";
		case "Ar01":
			return "学术资源";
		default:
			break;
  	}
	if (/^(FA|SP|SU|Fa|Sp|Su)(\d\d)$/gi.test(x)) {
		let season = {
			FA: "Fall",
			SP: "Spring",
			SU: "Summer",
			Fa: "Fall",
			Sp: "Spring",
			Su: "Summer",
		};
		let year = (y) => {
			return String(2000 + parseInt(y));
		};
		return season[x.substring(0, 2)] + " " + year(x.substring(2));
	} else {
		let cap = x.substring(0, 1).toUpperCase();
		return cap + x.substring(1).toLowerCase();
	}
}


function filterMostCurrentThreeTerm(x) {
	x = x.substring(4);
	// TODO: can use new Date().getFullYear() to get the current year, and start from there.
	if (
		x == "Fa23" ||
		x == "Sp23" ||
		x == "Su23" ||
		x == "Lf01" ||
		x == "Mj01" ||
		x == "Ar01"
	) {
		return true;
	} else {
		return false;
	}
}

function loadCourses(email, access_token) {
	if (debugMode === true) {
		if (email !== "huanzhimao@berkeley.edu") {
			window.location.href = "notice.html";
		}
	}
	let school;
	if (email.endsWith("@berkeley.edu")) {
		school = "UCB";
	} else if (email.endsWith("@USC.edu")) {
		school = "USC";
	} 
	console.log(school);
	if (allTerms.size !== 0) {
		return;
	}
	$("#main-container").addClass("logged-in");
	$("#card-container").html(
		`<div class="load-ani">
            <div></div><div></div><div></div><div></div>
        </div>`
	);
	$.ajax({
		url: api + "/courses/get_all_courses" + "/" + email + "/" + access_token,
		mothod: "GET",
		success: (response) => {
			$("#card-container").html("");
			$("#main-container").addClass("loaded");
			for (let course of response) {
				let term = parseTerm(course.school_name_and_term);
				if (filterMostCurrentThreeTerm(course.school_name_and_term)) {
					// Only display courses that's in the current term.
					addCard(
						course.course_id,
						course.course_name,
						course.course_qr_code_url,
						term,
						school
					);
					allTerms.add(term);
				}
			}
			let requestButton = $(`
				<div id="request-button" class="card function-button">
					<div>
						<div>&#128195</div>
						<div>申请建群</div>
					</div>
				</div>`
			);
			$("#card-container").append(requestButton);
			requestButton.on("click", () => {
				if (readUserToken()) {
					window.location.href = "request.html";
				} else {
					window.location.replace("index.html?redirect=request&timeout=1");
				}
			});

			// let addButton = $(`
			//  <div id="add-button" class="card function-button">
			//      <div>
			//          <div>&#11014</div>
			//          <div>上传临时二维码</div>
			//      </div>
			//  </div>`);
			// $("#card-container").append(addButton);
			// addButton.on("click", () => {
			//   if (readToken()) {
			//     window.location.href = "add.html";
			//   } else {
			//     window.location.replace("index.html?redirect=add&timeout=1");
			//   }
			// });

			let reportButton = $(`
				<div id="report-button" class="card function-button">
					<div>
						<div>&#11014</div>
						<div>故障报告</div>
					</div>
				</div>`
			);
			$("#card-container").append(reportButton);
			reportButton.on("click", () => {
				location.href = "https://forms.gle/56fJyQtw24JTaA2i9";
			});

			let logoutButton = $(`
				<div id="logout-button" class="card function-button">
					<div>
						<div>&#128274</div>
						<div>退出登录</div>
					</div>
				</div>`
			);
			$("#card-container").append(logoutButton);
			logoutButton.on("click", () => {
				deleteLocalStorage();
				location.reload();
    		});
      
			let termsArray = [];
			for (let x of allTerms) {
				termsArray.push(x);
			}

			let termToInt = (x) => {
				if (isNaN(x.slice(-2))) {
					return -1;
				}
				let separator = x.indexOf(" ");
				if (separator == -1) {
					return -1;
				} else {
					let season = x.substring(0, separator);
					let year = x.substring(separator + 1, x.length);
					let seasonInt;
					switch (season.toLowerCase()) {
						case "spring":
							seasonInt = 0;
							break;
						case "summer":
							seasonInt = 1;
							break;
						case "fall":
							seasonInt = 2;
							break;
						default:
							return -1;
					}
					return year * 3 + seasonInt;
				}
			};
			
			let termCompareFunction = (a, b) => {
				return termToInt(b) - termToInt(a);
			};
			termsArray.sort(termCompareFunction);
			
			let major_index = termsArray.indexOf("专业群");
			if (major_index !== -1) {
				termsArray.unshift(termsArray.splice(major_index, 1)[0]);
				termsArray[0] = "专业群";
			}
					
			let academic_index = termsArray.indexOf("学术资源");
			if (academic_index !== -1) {
				termsArray[academic_index] = "学术资源";
			}

			for (let term of termsArray) {
				let termId = term.replace(/ /gi, "-");
				let radio = $(`
                <input type="radio" name="term" id="term-${termId}" data-term="${term}" />
                <label for="term-${termId}">${term}</label>
            	`);
				$("#term-container").append(radio);
				$(radio[0]).on("change", (e) => {
					filter();
				});
			}
			if (termsArray[0]) {
				$(`#term-${termsArray[0].replace(/ /gi, "-")}`).attr(
					"checked",
					"checked"
				);
				filter();
			}
		},
		error: (response) => {
			console.log(response);
		},
	});
}

function saveDataToLocalStorage(email, token) {
	localStorage.setItem("user_email", email);
	localStorage.setItem("user_token", token);
	let currentTime = new Date();
	let currentTimeList = [
		currentTime.getUTCFullYear(),
		currentTime.getUTCMonth(),
		currentTime.getUTCDate(),
		currentTime.getUTCHours(),
	];
	localStorage.setItem("user_token_time", JSON.stringify(currentTimeList));
	console.log("email and token saved to local storage");
}

function deleteLocalStorage() {
	localStorage.removeItem("user_email");
	localStorage.removeItem("user_token");
	localStorage.removeItem("user_token_time");
	console.log("local storage cleared");
}

function readUserEmail() {
	return localStorage.getItem("user_email");
}

function readUserToken() {
	return localStorage.getItem("user_token");
}

function readUserTokenTime() {
	let token_time_data = localStorage.getItem("user_token_time");
	if (token_time_data !== null) {
		return JSON.parse(token_time_data);
	} else {
		return null;
	}
}

function checkValidToken() {
	let timeList = readUserTokenTime();
	if (timeList === null) {
		return false;
	}
	let currentTime = new Date();
	// let currentTimeUTC = Data.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate(), currentTime.getUTCHours());
	let tokenTime = Date.UTC(
		timeList[0],
		timeList[1],
		timeList[2],
		timeList[3],
		0,
		0,
		0
	);
	let diff_ms = currentTime.getTime() - tokenTime;
	// token is valid for 6 hours
	let diff_hours = diff_ms / 1000 / 60 / 60;
	if (diff_hours <= 6) {
		return true;
	}
	return false;
}
