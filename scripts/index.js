let api = "https://uncertaintycc.com/api/v1/";
let cookiesLoaded = false;

$(() => {
    if (/micromessenger/.test(navigator.userAgent.toLowerCase())) {
        $("#wechat-message").removeClass("hidden");
        return;
    }

    $("#login-wrapper").removeClass("hidden");

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

    $.urlParam = (name) => {
        let results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results && results.length >= 2) {
            return results[1] || 0;
        }
    }

    if ($.urlParam("timeout")) {
        $("#login-wrapper>div:first-child").text("会话过期，请重新登陆。");
    }

    let token = readCookie("token");
    if (token) {
        loadCourses(token);
    } else {
        gapi.load('auth2', () => {
            auth2 = gapi.auth2.init({
                client_id: '707915550129-7l94p2dpplaoub3d6clhrjpivki6dqpe.apps.googleusercontent.com',
                cookiepolicy: 'single_host_origin'
            });
            auth2.attachClickHandler($("#login-button")[0], {}, onSignIn, (error) => {
                if (error.error.indexOf("closed by user") == -1) {
                    alert("无法登陆，请稍后再试。");
                    console.log(error.error);
                }
            });
        });    
    }
});

let ids = [];

let entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};
  
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

function addCard(id, name, url, term) {
    ids.push(id);
    let lastSpace = id.lastIndexOf(" ");
    let codePart = escapeHtml(lastSpace == -1 ? "" : id.substring(0, lastSpace));
    let numPart = escapeHtml(id.substring(lastSpace + 1, id.length));
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
            <div class="desc">${escapeHtml(name)}</div>
        </div>`);
    $("#card-container").append(newCard);
    new QRCode(newCard.find(".qrcode")[0], {
        text: url,
        colorDark : "#333333",
        colorLight : "#da8388",
        correctLevel : QRCode.CorrectLevel.H
    })
    newCard.on("click", cardClick);
}

function cardClick(e) {
    alert("请保存图片，在微信扫一扫中选择相册打开。");
    let img = $(e.currentTarget).find("img").attr("src");
    // img = img.substring(img.indexOf(",") + 1);
    window.location.href = img;
}

function filter() {
    substring = $("#search-input").val().toLowerCase()
    let term = $("input[type='radio']:checked").data("term");
    for (let id of ids) {
        let card = $(`.card[data-id="${id}"]`);
        if ((id.toLowerCase().indexOf(substring) == -1) &&
                ((card.data("name").toLowerCase().indexOf(substring)) == -1) ||
                (term !== card.data("term"))) {
            card.addClass("hidden");
        } else {
            card.removeClass("hidden");
        }
    }
}

function onSignIn(googleUser) {
    let profile = googleUser.getBasicProfile();
    let email = profile.getEmail();
    $.ajax({url: api + "auth/", type: "POST",
            data: {email: email}, success: (response) => {
        createCookie("token", response.token, 60);
        if ($.urlParam("redirect") === "add") {
            window.location.href = "add.html";
        } else if ($.urlParam("redirect") === "queue") {
            window.location.href = "queue.html";
        } else {
            loadCourses(response.token);
        }
    }, error: (response) => {
        console.log(response);
        if (email.endsWith("berkeley.edu")) {
            alert("服务器错误，请稍后重试");
        } else {
            alert("你的邮箱不是Berkeley邮箱，请换为Berkeley邮箱登陆。");
        }
    }});
}

function parseTerm(x) {
    if (/^(FA|SP|SU)(\d\d)$/gi.test(x)) {
        let season = {"FA": "Fall", "SP": "Spring", "SU": "Summer"};
        let year = (y) => {
            return String(2000 + parseInt(y));
        }
        return season[x.substring(0, 2)] + " " + year(x.substring(2));
    } else {
        let cap = x.substring(0, 1).toUpperCase();
        return cap + x.substring(1).toLowerCase();
    }
}

function loadCourses(token) {
    $("#main-container").addClass("logged-in");
    $("#card-container").html("加加加加加加载中");
    $.ajax({url: api + "courses/", headers: {
        "Authorization": `Bearer ${token}`
    }, success: (response) => {
        $("#card-container").html("");
        $("#main-container").addClass("loaded");
        let allTerms = new Set();
        for (let course of response) {
            let term = parseTerm(course.term);
            addCard(course.code, course.name, course.qr_code, term);
            allTerms.add(term);
        }
        let addButton = $(`
            <div id="add-button" class="card">
                <div>
                    <div>+</div>
                    <div>添加条目</div>
                </div>
            </div>`);
        $("#card-container").append(addButton);
        addButton.on("click", () => {
            if (readCookie("token")) {
                window.location.href = "add.html";
            } else {
                window.location.replace("index.html?redirect=add&timeout=1");
            }
        })
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
            $(`#term-${termsArray[0].replace(/ /gi, "-")}`).attr("checked", "checked");
            filter();
        }
    }, error: (response) => {
        console.log(response);
    }});
}

function createCookie(name, value, minutes) {
    let date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    let expires = "; expires=" + date.toUTCString();
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    name = encodeURIComponent(name) + "=";
    for (c of document.cookie.split(';')) {
        c = c.trim();
        if (c.indexOf(name) === 0) {
            return decodeURIComponent(c.substring(name.length, c.length));
        }
    }
    return null;
}
