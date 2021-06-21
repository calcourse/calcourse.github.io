let api = "https://backend.calcourse.jackli.org/api/v1/";
let cards = [];

$(() => {
    token = readCookie("token");
    if (!token) {
        window.location.href = 'index.html?redirect=queue';
    }

    addInfo("正在加载审核队列");
    loadTickets();

    $("#btn-left").on("click", () => {
        moveTo(findPrev());
    });
    $("#btn-right").on("click", () => {
        moveTo(findNext());
    });
    $("#btn-pass").on("click", () => {
        pass(getCurrent());
    });
    $("#btn-block").on("click", () => {
        block(getCurrent());
    });
});

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

function loadTickets() {
    $.ajax({url: api + "tickets/", headers: {
        "Authorization": `Bearer ${token}`
    }, success: (response) => {
        $("#card-container").html("");
        for (let item of response.slice(0, 100)) {
            addCard(item.id, item.code, item.term, item.name, item.qr_code);
        }
        if (response.length) {
            cards[1].element.addClass("active");
            if (response.length > 100) {
                addInfo("请刷新页面以加载更多条目");
            }
        } else {
            addInfo("当前审核队列为空");
        }
    }, error: (response) => {
        fail(0, "加载失败，请刷新重试");
    }});
}

function addCard(id, name, term, desc, link) {
    let cardElement = $(`
        <div class="card" data-id="${cards.length}">
            <div class="card-status"></div>
            <div class="card-info-container">
                <div class="card-info-name">${name}</div>
                <div class="card-info-term">${term}</div>
                <div class="card-info-desc">${desc}</div>
                <a href="${link}" class="card-info-link">${link}</a>
            </div>
            <div class="card-message"></div>
        </div>`);

    cardElement.on("click", (e) => {
        let id = $(e.currentTarget).data("id");
        let c = cards[id];
        if (!c.completed) {
            moveTo(id, 110);
        }
    });

    $("#card-container").append(cardElement);
    let card = {
        id: id,
        type: "pending",
        completed: false,
        element: cardElement
    }
    cards.push(card);
    return cards.length - 1;
}

function addInfo(message) {
    let cardElement = $(`
        <div class="card" data-id="${cards.length}">
            <div class="card-info-container card-message-container">
                <div>${message}</div>
            </div>
            <div class="card-message"></div>
        </div>`);
    $("#card-container").append(cardElement);
    let card = {
        id: -1,
        type: "info",
        completed: true,
        element: cardElement
    }
    cards.push(card);
}

function getCurrent() {
    return parseInt($(".card.active").data("id"));
}

function pass(index) {
    if (isNaN(getCurrent())) {
        return;
    }
    cards[index].element.removeClass("failed").addClass("folded")
                        .removeClass("blocked").addClass("passed");
    cards[index].completed = true;
    cards[index].type = "passed";
    let next = findNext();
    $(".card.active").removeClass("active");
    moveTo(next, 110);
    $.ajax({url: api + `tickets/${cards[index].id}/confirm/`, headers: {
        "Authorization": `Bearer ${token}`
    }, success: (response) => {
        console.log(index, response);
        complete(index);
    }, error: (response) => {
        console.log(index, response);
        fail(index, "无法提交请求，请重试");
    }})
}

function block(index) {
    if (isNaN(getCurrent())) {
        return;
    }
    cards[index].element.removeClass("failed").addClass("folded")
                        .removeClass("passed").addClass("blocked");
    cards[index].completed = true;
    cards[index].type = "blocked";
    let next = findNext();
    $(".card.active").removeClass("active");
    moveTo(next, 110);
    $.ajax({url: api + `tickets/${cards[index].id}/`, method: "DELETE", headers: {
        "Authorization": `Bearer ${token}`
    }, success: (response) => {
        console.log(index, response);
        complete(index);
    }, error: (response) => {
        console.log(index, response);
        fail(index, "无法提交请求，请重试");
    }})
}

function fail(index, message) {
    cards[index].element.removeClass("folded").addClass("failed")
                        .find(".card-message").text(message);
    if (cards[index].type !== "info") {
        cards[index].completed = false;
    }
}

function complete(index) {
    cards[index].element.addClass("completed");
    cards[index].completed = true;
}

function findPrev() {
    let x = getCurrent();
    if (isNaN(x)) {
        x = cards.length;
    }
    x -= 1;
    while ((x >= 0) && cards[x].completed) {
        x -= 1;
    }
    return x >= 0 ? x : null;
}

function findNext() {
    let x = getCurrent();
    if (isNaN(x)) {
        x = -1;
    }
    x += 1;
    while ((x < cards.length) && cards[x].completed) {
        x += 1;
    }
    return x < cards.length ? x : null;
}

function moveTo(index, delay) {
    if (index === null || index === undefined) {
        return;
    }
    $(".card.active").removeClass("active");
    let newElement = cards[index].element;
    newElement.addClass("active");
    setTimeout(() => {
        let padWidth = Math.max($("body").width() * 0.05, ($("body").width() - 800) / 2);
        let oldScrollLeft = $("#queue-scroll-container").scrollLeft();
        let newScrollLeft = oldScrollLeft - (padWidth - newElement.position().left);
        $("#queue-scroll-container").animate({scrollLeft: newScrollLeft}, 200);
    }, delay ?? 0);
}
