let token = "";
let courseURL = "";
let helpLoaded = false;

$(() => {
    token = readCookie("token");
    if (!token) {
        window.location.href = 'index.html?redirect=add';
    }
    $("#help-button").on("click", () => {
        if (!helpLoaded) {
            $("#help-page-container").load("add-help.html");
            helpLoaded = true;
        }
        $("#help-container").toggleClass("hidden");
    });
    $("#help-close-button").on("click", () => {
        $("#help-container").toggleClass("hidden");
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

function processSubmit() {
    if (isLegalCourse()) {
        let term = $("input[name='term']:checked").val();
        let depCode = $("#dep-code").val().toUpperCase();
        let courseCode = $("#course-code").val().toUpperCase();
        findDuplicate(term, depCode, courseCode, courseURL);
    } else {
        $("#submit-text").text("课程信息不正确");
    }
}

function submitInfo(name, code, term) {
    $.ajax({
        type: 'POST',
        url: 'https://uncertaintycc.com/api/v1/tickets/',
        headers: {
            "Authorization": 'Bearer ' + token,
            "Content-Type": 'application/json',
        },
        dataType: 'json',
        data: JSON.stringify({
            "name": name,
            "code": code,
            "term": term,
            "qr_code": courseURL,
        }),
        success: (response) => {
            console.log(response);
            $("#submit-text").text("添加成功！审核通过后二维码就会出现啦");
        },
        error: (response) => {
            console.log(response);
            $("#submit-text").text("添加失败，请稍后重试");
        },
    });
}

function loadPreview() {
    let imgContainer =
        `<div id="img-container">
            <canvas id="canv" width="0" height="0"></canvas>
            <div id="upload-text"></div>
        </div>`;
    $("#img-wrapper").html(imgContainer);
    let qrCodeFile = $("#qr")[0].files[0];
    if (!qrCodeFile) {
        $("#upload-text").text("emm.. 还在盼着二维码");
        return;
    }
    let previewer = new FileReader();
    previewer.onload = (e) => {
        let qrCodeImg = new Image();
        qrCodeImg.src = e.target.result;
        qrCodeImg.onload = () => {
            let canv = $("#canv")[0];
            let context = canv.getContext("2d");
            try {
                canv.style.visibility = 'hidden';
                fitImageOntoCanvasAndDisplay(context, canv, qrCodeImg, 300, 300);
                let img_data = new ImageData(
                    context.getImageData(
                        0, 0, canv.width, canv.height).data,
                    canv.width,
                    canv.height);
                fitImageOntoCanvasAndDisplay(context, canv, qrCodeImg, 120, 120);
                updatePageURLWithImageUploaded(img_data);
                canv.style.visibility = 'visible';
            } catch (err) {
                $("#upload-text").text("唔，出错了，请重试");
            }
        }
    };
    previewer.readAsDataURL(qrCodeFile);
}

function fitImageOntoCanvasAndDisplay(ctx, canv, image, width, height) {
    let scale = Math.min((width / image.width), (height / image.height), 1);
    canv.width = image.width * scale;
    canv.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canv.width, canv.height);
}

function updatePageURLWithImageUploaded(image_data){
    let url = getURL(image_data);
    $("#upload-text").text("");
    switch (url){
    case 2:
        $("#upload-text").text("好像不是二维码");
        break;
    case 1:
        $("#upload-text").text("请上传微信二维码");
        break;
    default:
        courseURL = url;
        break;
    }
}

function isLegalURL(url) {
    let regex = new RegExp("^https://weixin.qq.com/g/([a-zA-Z0-9-_]+)$");
    if (regex.test(url)) {
        return true;
    }
    return false;
}

function getURL(image_data) {
    let qrCodeRead = jsQR(image_data.data, image_data.width, image_data.height);
    if (qrCodeRead) {
        url = qrCodeRead.data;
        if (isLegalURL(url)){
            return url;
        }
        return 1;
    }
    else {
        return 2;
    }
}

function getCode() {
    return $("#dep-code").val().toUpperCase() + " " + $("#course-code").val().toUpperCase();
}

function findDuplicate(term, depCode, couCode, url) {
    $.ajax({
        url: 'https://uncertaintycc.com/api/v1/courses/',
        headers: {
            "Authorization": "Bearer " + token,
        },
        success: (response) => {
            let found = findInResponse(response, term, depCode, couCode, url);
            if (found) {
                $("#submit-text").text("已经有了哦");
            } else {
                submitInfo($("#course-name").val(), getCode(), term);
            }
        },
        error: (response) => {
            $("#submit-text").text("糟糕，服务器走丢了！");
        }
    });
}

function findInResponse(response, term, depCode, couCode, url) {
    let found = false;
    for (let course of response) {
        if (course.term === term) {
            let courseCodeSplit = course.code.split(" ");
            if (courseCodeSplit[0] === depCode && courseCodeSplit[1] === couCode) {
                found = true;
                break;
            }
        }
        if (course.qr_code === url) {
            found = true;
            break;
        }
    }
    return found;
}

function isNotEmpty(value) {
    if (!value) {
        console.log("No input");
        return false;
    } else if (value.replace(/(^s*)|(s*$)/g, "").length === 0) {
        console.log("Empty input");
        return false;
    }
    return true;
}

function isLegalCourse() {
    let depCodeInputField = $("#dep-code");
    let depCodeInput = depCodeInputField.val();
    let couCodeInputField = $("#course-code");
    let couCodeInput = couCodeInputField.val();
    let nameInputField = $("#course-name");
    let nameInput = nameInputField.val();
    if (!$("input[name='term']:checked").val()) {
        return false;
    }
    if (isNotEmpty(depCodeInput) && isNotEmpty(couCodeInput) && isNotEmpty(nameInput)) {
        if (depCodeInput === "CS") {
            depCodeInput = "COMPSCI";
        }
        depCodeInput = depCodeInput.toUpperCase();
        couCodeInput = couCodeInput.toUpperCase();
        let code = depCodeInput + " " + couCodeInput;
        if (isLegalURL(courseURL)) {
            return true;
        }
        console.log("no image");
    }
    return false;
}
