// New API socket
let api = "https://j2xnmuiw4k.execute-api.us-west-1.amazonaws.com/CalCourse";
let cookiesLoaded = false;
let helpLoaded = false;

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
    $("#login-description").text("我们需要验证你的学生身份");
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
    $("#login-wrapper>div:first-child").text("会话过期，请重新登陆。");
  }

  let token = readCookie("token");
  if (token) {
    loadCourses(token);
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

function handleClientLoad() {
  gapi.load("auth2", () => {
    auth2 = gapi.auth2.init({
      client_id:
        "707915550129-7l94p2dpplaoub3d6clhrjpivki6dqpe.apps.googleusercontent.com",
      cookiepolicy: "single_host_origin",
      // plugin_name: "com.calcourse",
    });

    auth2.attachClickHandler(
      $("#google-login-button")[0],
      {},
      onGoogleSignIn,
      (error) => {
        if (error.error.indexOf("closed by user") == -1) {
          $("#login-description").text("验证失败，请重试");
          console.log(error);
        }
      }
    );
  });
}

async function sendEmailCode() {
  let emailInput = $("#email-input").val().toLowerCase();
  let emailReg = new RegExp("^[A-Za-z0-9._-]+$");
  if (!emailInput) {
    $("#login-description").text("请填写Berkeley邮箱地址");
  } else if (!emailReg.test(emailInput)) {
    $("#login-description").text("邮箱格式不正确");
  } else {
    sendEmailCodeCountDown();
    USER_EMAIL = emailInput + "@berkeley.edu";
    let form = new FormData();
    form.append("email", USER_EMAIL);
    $.ajax({
      url: api + "/email/send_verification_code/" + USER_EMAIL,
      type: "POST",
      processData: false,
      contentType: false,
      success: (response) => {
        $("#login-description").text("请查收并填写邮箱验证码");
        console.log(response);
      },
      error: (response) => {
        console.log(response);
        $("#login-description").text("无法发送验证码到该邮箱，请重试");
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
    $("#login-description").text("请先获取验证码");
  } else if (!codeInput) {
    $("#login-description").text("请填写验证码");
  } else if (!codeReg.test(codeInput)) {
    $("#login-description").text("验证码格式不正确");
  } else {
    $("#email-login-button").html("<span>登录中</span>");
    $("#email-login-button").off("click");
    USER_CODE = String(codeInput);

    $.ajax({
      url:
        api +
        "/email/verify_authentication_code/" +
        USER_EMAIL +
        "/" +
        USER_CODE,
      type: "GET",
      processData: false,
      contentType: false,
      success: (response) => {
        console.log(response);
        $("#email-login-button").html("<span>登录</span>");
        $("#email-login-button").on("click", onEmailSignIn);
        loadCourses();
      },
      error: (response) => {
        console.log(response);
        $("#email-login-button").html("<span>登录</span>");
        $("#email-login-button").on("click", onEmailSignIn);
        $("#login-description").text("验证失败，请重试");
      },
    });
  }
}

function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function addCard(id, name, url, term) {
  ids.push(id);
  let lastSpace = name.lastIndexOf(" ");
  let codePart = escapeHtml(
    lastSpace == -1 ? "" : name.substring(0, lastSpace)
  );
  let numPart = escapeHtml(name.substring(lastSpace + 1, name.length));
  let newCard = $(
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
  $("#card-container").append(newCard);

  newCard.on("mouseenter", cardEnter);
  newCard.on("mouseleave", cardLeave);
  newCard.on("click", cardClick);
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
    "请保存图片，在微信扫一扫中选择相册打开。\n请不要把任何CalCourse上的群二维码发到任何群内，只给他们CalCourse的链接即可，防止代写跳过CalCourse的身份验证直接扫码加群.\n谢谢配合!"
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
      (String(id).indexOf(substring) == -1 &&
        card.data("name").toLowerCase().indexOf(substring) == -1) ||
      term !== card.data("term")
    ) {
      card.addClass("hidden");
    } else {
      card.removeClass("hidden");
    }
  }
}


function onGoogleSignIn(googleUser) {
  let profile = googleUser.getBasicProfile();
  let email = profile.getEmail();
  $.ajax({
    url: api + "/email/verify_email/" + email,
    type: "GET",
    success: (response) => {
        loadCourses();
      // createCookie("token", response.token, 1440);
      // if ($.urlParam("redirect") === "add") {
      //   window.location.href = "add.html";
      // } else if ($.urlParam("redirect") === "queue") {
      //   window.location.href = "queue.html";
      // } else {
      // }
    },
    error: (response) => {
      console.log(response);
      if (email.endsWith("berkeley.edu")) {
        $("#login-description").text("服务器错误，请稍后重试");
      } else {
        $("#login-description").text("请换用bConnected账号登录");
      }
    },
  });
}

// This function is commented out. It's the old version
// function onGoogleSignIn(googleUser) {
//   console.log(4);
//   let profile = googleUser.getBasicProfile();
//   console.log(profile);
//   let email = profile.getEmail();
//   console.log(email);
//   if (email.endsWith("berkeley.edu")) {
//     loadCourses();
//   } else {
//     $("#login-description").text("请换用bConnected账号登录");
//   }
  // $.ajax({
  //   url: api + "auth/",
  //   type: "POST",
  //   data: { email: email },
  //   success: (response) => {
  //     createCookie("token", response.token, 1440);
  //     if ($.urlParam("redirect") === "add") {
  //       window.location.href = "add.html";
  //     } else if ($.urlParam("redirect") === "queue") {
  //       window.location.href = "queue.html";
  //     } else {
  //       loadCourses(response.token);
  //     }
  //   },
  //   error: (response) => {
  //     console.log(response);
  //     if (email.endsWith("berkeley.edu")) {
  //       $("#login-description").text("服务器错误，请稍后重试");
  //     } else {
  //       $("#login-description").text("请换用bConnected账号登录");
  //     }
  //   },
  // });
// }

function parseTerm(x) {
  if (/^(FA|SP|SU|Fa|Sp|Su|Lf)(\d\d)$/gi.test(x)) {
    let season = {
      FA: "Fall",
      SP: "Spring",
      SU: "Summer",
      Fa: "Fall",
      Sp: "Spring",
      Su: "Summer",
      Lf: "Cal Life",
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

// Manually filter out only the most current three terms.
// Need to change the value every semester
function filterMostCurrentThreeTerm(x) {
  if (x == "Fa22" || x == "Sp23" || x == "Su23" || x == "Lf22") {
    return true;
  } else {
    return false;
  }
}
function loadCourses() {
  $("#main-container").addClass("logged-in");
  $("#card-container").html(
    `<div class="load-ani">
            <div></div><div></div><div></div><div></div>
        </div>`
  );
  $.ajax({
    url: api + "/courses/get_all_courses",
    success: (response) => {
      $("#card-container").html("");
      $("#main-container").addClass("loaded");
      let allTerms = new Set();
      for (let course of response) {
        let term = parseTerm(course.course_term);
        if (filterMostCurrentThreeTerm(course.course_term)) {
          // Only display courses that's in the current term.
          addCard(
            course.course_id,
            course.course_name,
            course.course_qr_code_url,
            term
          );
          allTerms.add(term);
        }
      }
      let addButton = $(`
            <div id="add-button" class="card">
                <div>
                    <div>+</div>
                    <div>添加课程</div>
                </div>
            </div>`);
      $("#card-container").append(addButton);
      addButton.on("click", () => {
        if (readCookie("token")) {
          window.location.href = "add.html";
        } else {
          window.location.replace("index.html?redirect=add&timeout=1");
        }
      });
      let termsArray = [];
      for (let x of allTerms) {
        termsArray.push(x);
      }
      let termToInt = (x) => {
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
      termsArray.sort((a, b) => {
        return termToInt(b) - termToInt(a);
      });
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

function createCookie(name, value, minutes) {
  let date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  let expires = "; expires=" + date.toUTCString();
  document.cookie =
    encodeURIComponent(name) +
    "=" +
    encodeURIComponent(value) +
    expires +
    "; path=/";
}

function readCookie(name) {
  name = encodeURIComponent(name) + "=";
  for (c of document.cookie.split(";")) {
    c = c.trim();
    if (c.indexOf(name) === 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
  return null;
}
