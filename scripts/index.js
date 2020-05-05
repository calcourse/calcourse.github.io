let api = 'http://118.25.79.158:3000/api/v1/';
let ids=[];

window.onload = function() {
    $(() => {
        $("#search-input").on("input", () => {
            filter();
        });
        $(".toggle-button").on("click", () => {
            $("#about-container").toggleClass("hidden");
        });
    });

    let token = readCookie("token");

    if (token) {
        loadCourses(token);
    } else {
        window.location.href = 'signin.html';
    }
};


function addCard(id, name, url, term) {
    ids.push(id);
    let lastSpace = id.lastIndexOf(" ");
    let codePart = lastSpace === -1 ? "" : id.substring(0, lastSpace);
    let numPart = id.substring(lastSpace + 1, id.length);
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

function filter() {
    substring = $("#search-input").val().toLowerCase();
    let term = $("input[type='radio']:checked").data("term");
    for (let id of ids) {
        let card = $(`.card[data-id="${id}"]`);
        if ((id.toLowerCase().indexOf(substring) === -1) &&
            ((card.data("name").toLowerCase().indexOf(substring)) === -1) ||
            (term !== card.data("term"))) {
            card.addClass("hidden");
        } else {
            card.removeClass("hidden");
        }
    }
}

function loadCourses(token) {
    $("#card-container").html("加加加加加加载中");
    $.ajax({
        url: 'http://118.25.79.158:3000/api/v1/courses/',
        type: 'GET',
        headers: {
            "Authorization": "Bearer " + token,
        },
        success: (response) => {
            $("#card-container").html("");
            $("#main-container").addClass("loaded");
            let allTerms = new Set();
            for (let course of response) {
                addCard(course.code, course.name, course.qr_code, course.term);
                allTerms.add(course.term);
            }
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
                let termId = replaceAll(term," ", "-");
                let radio = $(`
                <input type="radio" name="term" id="term-${termId}" data-term="${term}" />
                <label for="term-${termId}">${term}</label>
            `);
                $("#term-container").append(radio);
                $(radio[0]).on("change", (e) => {
                    filter();
                });
            }
            $(`#term-${replaceAll(termsArray[0], " ", "-")}`).attr("checked", "checked");
            filter();},
        error: (response) => {
        console.log(response);
    }});
}

function replaceAll(str, toBeReplaced, replacement) {
    let reg = new RegExp(toBeReplaced, 'g');
    return str.replace(reg, replacement);
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
