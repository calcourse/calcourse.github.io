let api = "http://118.25.79.158:3000/api/vvv/courses/";

$(() => {
    $.ajax({url: api, headers: {
        "Authorization": "Bearer gobears"
    }, success: (response) => {
        $("#card-container").html("");
        for (let course of response) {
            addCard(course.code, course.name, course.qr_code);
        }
    }, error: (response) => {
        console.log(response);
    }});
    $("#search-input").on("input", () => {
        filter($("#search-input").val());
    });
    $(".toggle-button").on("click", () => {
        $("#about-container").toggleClass("hidden");
    });
    $(".card").on("click", (e) => {
        let card = e.currentTarget;
        window.location.href = $(card).data("url");
    });
});

let ids=[];

function addCard(id, name, url) {
    ids.push(id);
    let newCard = $(
        `<div class="card" data-id="${id}" data-name="${name}" data-url="${url}">
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
