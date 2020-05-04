let api = "http://118.25.79.158:3000/api/v1/";

$(() => {
    $("#search-input").on("input", () => {
        filter($("#search-input").val());
    });
    $(".toggle-button").on("click", () => {
        $("#about-container").toggleClass("hidden");
    });

    /*   DEBUG   */
    //createCookie("token", "hilfinger", 60);
    /* END DEBUG */

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

let ids=[];

function addCard(id, name, url) {
    ids.push(id);
    let lastSpace = id.lastIndexOf(" ");
    let codePart = lastSpace == -1 ? "" : id.substring(0, lastSpace);
    let numPart = id.substring(lastSpace + 1, id.length);
    let newCard = $(
        `<div class="card" data-id="${id}" data-name="${name}" data-url="${url}">
            <div class="id-wrapper">
                <div class="id">
                    <span>
                        ${codePart} <span>${numPart}</span>
                    </span>
                </div>
            </div>
            <div class="qrcode"></div>
            <div class="desc">${name}</div>
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
    let card = e.currentTarget;
    window.location.href = $(card).data("url");
}

function filter(substring) {
    substring = substring.toLowerCase()
    for (let id of ids) {
        let card = $(`.card[data-id="${id}"]`);
        if ((id.toLowerCase().indexOf(substring) == -1) &&
            (card.data("name").toLowerCase().indexOf(substring)) == -1) {
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
        createCookie("token", response.token, 10);
        loadCourses(response.token);
    }, error: (response) => {
        alert("你的邮箱不是Berkeley邮箱，请换为Berkeley邮箱登陆。");
    }});
}

function loadCourses(token) {
    $("#card-container").html("加加加加加加载中");
    $.ajax({url: api + "courses/", headers: {
        "Authorization": `Bearer ${token}`
    }, success: (response) => {
        $("#card-container").html("").addClass("loaded");
        for (let course of response) {
            addCard(course.code, course.name, course.qr_code);
        }
    }, error: (response) => {
        console.log(response);
    }});
}

function createCookie(name, value, minutes) {
    let date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    let expires = "; expires=" + date.toGMTString();
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
