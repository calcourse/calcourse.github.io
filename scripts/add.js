let token = '';
let courseURL = '';

window.onload = function() {
    token = readCookie("token");
    if (!token) {
        window.location.href = 'index.html?redirect=add';
    }
};

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
        let term = $("#term").val();
        let depCode = $("#dep-code").val().toUpperCase();
        let courseCode = $("#course-code").val().toUpperCase();
        findDuplicate(term, depCode, courseCode, courseURL);
    } else {
        document.getElementById("submit-text").textContent = "课程信息不正确";
    }
}


function submitInfo(name, code, term) {
    $.ajax({
        type: 'POST',
        url: 'http://118.25.79.158:3000/api/v1/courses/',
        // FIXME： change to actual token
        headers: {
            "Authorization": "Bearer hilfinger",
            "Content-Type": 'application/json',
        },
        dataType: 'json',
        data: JSON.stringify({
            "name": name,
            "code": code,
            "term": term,
            "qr_code": courseURL
        }),
        success: (response) => {
            console.log(response);
            document.getElementById("submit-text").textContent = "添加成功！";
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        },
        error: (response) => {
            console.log(response);
        },
    });
}

function loadPreview() {
    let qrCodeFile = document.getElementById('qr').files[0];
    if (qrCodeFile === null || qrCodeFile === undefined) {
        document.getElementById("upload-text").textContent = "No image upload.";
        return;
    }
    // This could be changed to just loading to Image for simplicity, but why change if the current one works
    let previewer = new FileReader();
    previewer.onload = function(e) {
        let qrCodeImg = new Image;
        qrCodeImg.src = e.target.result;
        qrCodeImg.style = "max-width: 150px; max-height: 150px";
        qrCodeImg.onload = function() {
            let canv = document.getElementById("canv");
            let context = canv.getContext("2d");
            fitImageOntoCanvasAndDisplay(context, qrCodeImg, 360, 780);
            try {
                let img_data = new ImageData(
                    context.getImageData(
                        0, 0, canv.width, canv.height).data,
                    canv.width,
                    canv.height);
                updatePageURLWithImageUploaded(img_data);
            }
            catch (err) {
                document.getElementById("upload-text").textContent = "加载预览失败。";
            }
        }

    };
    previewer.readAsDataURL(qrCodeFile);
}


function fitImageOntoCanvasAndDisplay(ctx, image, width, height) {
    let scale = Math.min((width / image.width), (height / image.height), 1);
    canv.width = image.width * scale;
    canv.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canv.width, canv.height);
}

function updatePageURLWithImageUploaded(image_data){
    let url = getURL(image_data);
    document.getElementById("upload-text").textContent = "";
    switch (url){
    case 2:
        document.getElementById("upload-text").textContent = "No qr code found";
        break;
    case 1:
        document.getElementById("upload-text").textContent = "Bruh, wut qr code is this";
        // No break here as we want to display it anyways
    default:
        document.getElementById("upload-text").textContent += url;
        courseURL = url;
    }
}

function isLegalURL(url) {
    let regex = new RegExp("^https://weixin.qq.com/g/([a-zA-Z0-9-_]{16})$");
    if (regex.test(url)) {
        return true;
    }
    return false;
}

// image_data is ImageData or Uint8ClampedArray, give it undecoded stuff shit will happen
function getURL(image_data) {
    // TODO: might be better ones than jsQR, this is just most recent (it's bigger)
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
    return $("#dep-code").val() + " " + $("#course-code").val();
}

function findDuplicate(term, depCode, couCode, url) {
    $.ajax({
        url: 'http://118.25.79.158:3000/api/v1/courses/',
        headers: {
            "Authorization": 'Bearer ' + token,
        },
        success: (response) => {
            let found = findInResponse(response, term, depCode, couCode, url);
            if (found) {
                document.getElementById("submit-text").textContent = "该课程已存在。";
            } else {
                submitInfo($("#course-name").val(), depCode + " " + couCode, term);
            }
        },
        error: (response) => {
            document.getElementById("submit-text").textContent = "无法连接服务器。";
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
        if (course.url === url) {
            //FIXME
            found = true;
            break;
        }
    }
    return found;
}

function isNotEmpty(value) {
    if (value === undefined || value === null) {
        console.log("No input");
        return false;
    } else if (value.replace(/(^s*)|(s*$)/g, "").length === 0) {
        console.log("Empty input");
        return false;
    }
    return true;
}

function isLegalCode(code) {
    let regex = new RegExp("^([a-zA-Z]+ [a-zA-Z]?[0-9]+[a-zA-Z]*)$");
    if (regex.test(code)) {
        return true;
    } else {
        console.log("Wrong course code.");
        return false;
    }
}

function isLegalCourse() {
    let depCodeInputField = document.getElementById("dep-code");
    let depCodeInput = depCodeInputField.value;
    let couCodeInputField = document.getElementById("course-code");
    let couCodeInput = couCodeInputField.value;
    let nameInputField = document.getElementById("course-name");
    let nameInput = nameInputField.value;
    if (isNotEmpty(depCodeInput) && isNotEmpty(couCodeInput) && isNotEmpty(nameInput)) {
        if (depCodeInput === "CS") {
            depCodeInput = "COMPSCI";
        }
        depCodeInput = depCodeInput.toUpperCase();
        couCodeInput = couCodeInput.toUpperCase();
        let code = depCodeInput + " " + couCodeInput;
        if (isLegalCode(code)) {
            if (isLegalURL(courseURL)) {
                return true;
            }
            console.log("no image");
        }
    }
    return false;
}
