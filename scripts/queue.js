let api = "http://118.25.79.158:3000/api/v1/";
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
            moveTo(1);
            if (response.length > 100) {
                addInfo("请刷新页面以加载更多条目");
            }
        } else {
            addInfo("当前审核队列为空");
        }
        /*addCard(0, "CS 61A", "Spring 2020", "Structure and Interpretation of Computer Programs", "https://weixin.qq.com/blablabla");
        addCard(1, "CS 61B", "Fall 2020", "Studying Paul Hilfinger's fingers Wow this is a long sentence blablabla", "https://weixin.qq.com/blablabla");
        addCard(2, "CS 99Z", "Summer 2020", "AP Computer Science A", "https://weixin.qq.com/blablabla");
        addCard(3, "CS 199Z", "Spring 2021", "AP Computer Science Principles", "https://weixin.qq.com/blablabla");*/
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
    moveTo(findNext(), 110);
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
    moveTo(findNext(), 110);
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
    cards[index].completed = false;
}

function complete(index) {
    cards[index].element.addClass("completed");
    cards[index].completed = true;
}

function findPrev() {
    if (isNaN(getCurrent())) {
        return;
    }
    let x = getCurrent() - 1;
    while ((x >= 0) && cards[x].completed) {
        x -= 1;
    }
    return x >= 0 ? x : getCurrent();
}

function findNext() {
    if (isNaN(getCurrent())) {
        return;
    }
    let x = getCurrent() + 1;
    while ((x < cards.length) && cards[x].completed) {
        x += 1;
    }
    return x < cards.length ? x : getCurrent();
}

function moveTo(index, delay) {
    if (isNaN(getCurrent()) || index == getCurrent()) {
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