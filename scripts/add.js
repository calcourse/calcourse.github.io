let serverURL = 'https://backend.calcourse.jackli.org/api/v1/';
let token = "";
let courseURL = "";
let courseTerm = "";
let courseCode = "";
let courseName = "";
let checkInProgress;

$(() => {
    token = readCookie("token");
    if (!token) {
        window.location.href = 'index.html?redirect=add';
    }
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
                $("#upload-text").text("出错了，请重试");
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
    let URLCheckResult = processURL(image_data);
    qrAlert("正在检查二维码");
    switch (URLCheckResult){
        case "CORRECT_URL":
            qrAlert("");
            break;
        case "NO_URL":
            qrAlert("没有检测到二维码");
            break;
        case "ILLEGAL_URL":
            qrAlert("好像不是微信群的二维码");
            break;
        default:
            console.log(URLCheckResult);
            qrAlert("出错了，请稍后重试");
            break;
    }
}

function isLegalURL(url) {
    let regex_normal = new RegExp("^https://weixin.qq.com/g/([a-zA-Z0-9-_]+)$");
    let regex_work = new RegExp("^https://work.weixin.qq.com/gm/([a-zA-Z0-9-_]+)$");
    return regex_normal.test(url) || regex_work.test(url);
}

function processURL(image_data) {
    let qrCodeRead = jsQR(image_data.data, image_data.width, image_data.height);
    let url;
    if (qrCodeRead) {
        url = qrCodeRead.data;
        if (isLegalURL(url)) {
            courseURL = url;
            return "CORRECT_URL";
        } else {
            return "ILLEGAL_URL";
        }
    } else {
        return "NO_URL";
    }
}

function qrAlert(message) {
    $("#upload-text").text(message);
}

function startSubmit() {
    if (readCookie("token")) {
        $("#submit-button").on("click", () => {});
        if (!(processCourseInput() && processQRInput())) {
            restoreSubmitButton();
        } else {
            checkDuplicateAndSubmit();
        }    
    } else {
        submitAlert("会话过期，请刷新重新登录");
    }
}

function restoreSubmitButton() {
    $("#submit-button").on("click", startSubmit);
}

function processCourseInput() {
    let checks = [processCourseTermInput(), processDepCodeInput(),
        processNumCodeInput(), processCourseNameInput()];
    if (checks.some(e => !e)) {
        return false;
    }
    courseTerm = checks[0];
    courseCode = `${checks[1]} ${checks[2]}`;
    courseName = checks[3];
    return true;
}

function processCourseTermInput() {
    let courseTermInput = $("input[name='term']:checked").val();
    if (!courseTermInput) {
        submitAlert("请选择学期");
        return null;
    } else {
        return courseTermInput;
    }
}

function processDepCodeInput() {
    let depCodeInput = $("#dep-code").val();
    if(checkNonemptyAndLegal("DEP_CODE", depCodeInput)){
        return reduceDepCodeVariation(depCodeInput.toUpperCase());
    } else {
        return null;
    }
}

function processNumCodeInput() {
    let numCodeInput = $("#num-code").val();
    if(checkNonemptyAndLegal("NUM_CODE", numCodeInput)) {
        return numCodeInput.toUpperCase();
    } else {
        return null;
    }
}

function processCourseNameInput() {
    let courseNameInput = $("#course-name").val();
    if(checkNonemptyAndLegal("COURSE_NAME", courseNameInput)) {
        return courseNameInput;
    } else {
        return null;
    }
}

function isEmpty(value) {
    if (!value) {
        return true;
    } else return value.replace(/(^s*)|(s*$)/g, "").length === 0;
}

function isIllegal(flag, value) {
    switch (flag) {
        case "DEP_CODE":
            let depCodeReg = /^[a-zA-Z]+$/
            return !(depCodeReg.test(value) && value.length < 11);
        case "NUM_CODE":
            let numCodeReg = /^[a-zA-Z]?[0-9]+[a-zA-Z]*(-[0-9]{3})?$/
            return !(numCodeReg.test(value) && value.length < 11);
        case "COURSE_NAME":
            let courseNameReg = /^[a-zA-Z0-9()_ ]+$/
            return !(courseNameReg.test(value) && value.length < 51);
    }
}

function checkNonemptyAndLegal(FLAG, value) {
    if (isEmpty(value)) {
            submitAlert("请补全课程信息");
        return false;
    } else if (isIllegal(FLAG, value)) {
        submitAlert("课程信息格式不正确");
        return false;
    } else {
        return true;
    }
}

function reduceDepCodeVariation(depCode) {
    switch (depCode) {
        case "CS":
            return "COMPSCI";
        case "NST":
            return "NUSCTX";
        case "ENG":
            return "ENGLISH";
        default:
            return depCode;
    }
}

function processQRInput() {
    if (isLegalURL(courseURL)) {
        return true;
    } else {
        submitAlert("请上传二维码");
        return false;
    }
}

function checkDuplicateAndSubmit() {
    submitAlert("正在验证是否有重复");
    checkInProgress = 2;
    $.ajax({
        url: serverURL + 'courses/',
        headers: {
            "Authorization": "Bearer " + token,
        },
        success: (response) => {
            let findResult = findInResponse(response, courseTerm, courseCode, courseURL);
            if (findResult[0]) {
                checkDuplicateCallBack("DUPLICATE");
                submitAlert("这个" + findResult[1] + "已经有人传过啦");
                restoreSubmitButton();
            } else {
                checkDuplicateCallBack("OK");
            }
        },
        error: (response) => {
            console.log(response);
            submitAlert("上传失败");
            restoreSubmitButton();
        }
    });
    $.ajax({
        url: serverURL + 'tickets/',
        headers: {
            "Authorization": "Bearer " + token,
        },
        success: (response) => {
            let findResult = findInResponse(response, courseTerm, courseCode, courseURL);
            if (findResult[0]) {
                checkDuplicateCallBack("DUPLICATE");
                submitAlert("这个" + findResult[1] + "已经待审核啦");
                restoreSubmitButton();
            } else {
                checkDuplicateCallBack("OK");
            }
        },
        error: (response) => {
            console.log(response);
            submitAlert("上传失败");
            restoreSubmitButton();
        }
    });
}

function checkDuplicateCallBack(FLAG) {
    if (FLAG === "OK") {
        checkInProgress -= 1;
    } else if (FLAG === "DUPLICATE") {
        checkInProgress = -1;
    }
    if (checkInProgress === 0) {
        submitInfo();
    }
}

function findInResponse(response) {
    let found = false;
    let msg = "";
    for (let course of response) {
        if (course.term === courseTerm && course.code === courseCode) {
            found = true;
            msg = "课程";
            break;
        } else if (course.qr_code === courseURL) {
            found = true;
            msg = "二维码";
            break;
        }
    }
    return [found, msg];
}


function submitInfo() {
    submitAlert("一切就绪，正在上传");
    $.ajax({
        type: 'POST',
        url: serverURL + 'tickets/',
        headers: {
            "Authorization": 'Bearer ' + token,
            "Content-Type": 'application/json',
        },
        dataType: 'json',
        data: JSON.stringify({
            "name": courseName,
            "code": courseCode,
            "term": courseTerm,
            "qr_code": courseURL,
        }),
        success: (response) => {
            console.log(response);
            submitAlert("添加成功！审核通过后二维码就会出现啦");
            restoreSubmitButton();
        },
        error: (response) => {
            console.log(response);
            submitAlert("上传失败");
            restoreSubmitButton();
        },
    });
}

function submitAlert(message) {
    $("#submit-text").text(message);
}
