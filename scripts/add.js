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

function submitInfo() {
    if (getLegalCourse()) {
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
                "name": $("#course-name").val(),
                "code": $("#course-code").val(),
                "term": $("#term").val(),
                "qr_code": courseURL
            }),
            success: (response) => {
                console.log(response);
                document.getElementById("submit-text").textContent = "Submit Success.";
            },
            error: (response) => {
                console.log(response);
            },
        })
    } else {
        document.getElementById("submit-text").textContent = "Illegal Info.";
    }
}

function loadPreview() {
    let qrCodeFile = document.getElementById('qr').files[0];
    if (qrCodeFile === null || qrCodeFile === undefined) {
        document.getElementById("upload-text").textContent = "No image upload.";
        return;
    }
    // This could be changed to just loading to Image for simplicity, but why change if the current one works
    let previewer = new FileReader();
    previewer.onload = function (e) {
        let qrCodeImg = new Image;
        qrCodeImg.src = e.target.result;
        qrCodeImg.style = "max-width: 150px; max-height: 150px";
        // Instead of just loading the image, draw it onto canvas for easier conversion
        let canv = document.getElementById("canv");
        let context = canv.getContext("2d")
        // Magic number here for 260 and 780
        fitImageOntoCanvasAndDisplay(context, qrCodeImg, 360, 780);
        // This is messy, but if such wrapping does not exist shitty things might happen with jsQR
        try {
        let img_data = new ImageData(
            context.getImageData(
                0, 0, canv.width, canv.height).data,
                canv.width,
                canv.height);
        updatePageURLWithImageUploaded(img_data);
        }
        catch (err) {
            document.getElementById("upload-text").textContent =
            "Loading failed. This is either because your browser screwd things up" +
            "or because you clicked preview too fast.\n" +
            "plz click preview again in a few seconds.";
        }
    };
    previewer.readAsDataURL(qrCodeFile);
}


function fitImageOntoCanvasAndDisplay(ctx, image, width, height) {
    // Scale the canvas to acceptable size to display stuff, if image is small then don't scale
    let scale = Math.min((width / image.width), (height / image.height), 1);
    canv.width = image.width * scale;
    canv.height = image.height * scale;
    // Then scale the image so that it fits canvas
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
    let regex = new RegExp("^([a-zA-Z]+ [0-9]+[a-zA-Z]*)$");
    if (regex.test(code)) {
        return true;
    } else {
        console.log("Wrong course code.");
        return false;
    }
}

function getLegalCourse() {
    let codeInputField = document.getElementById("course-code");
    let codeInput = codeInputField.value;
    let nameInputField = document.getElementById("course-name");
    let nameInput = nameInputField.value;
    if (isNotEmpty(codeInput) && isNotEmpty(nameInput) && isLegalCode(codeInput)) {
        loadPreview();
        loadPreview();
        if (isLegalURL(courseURL)) {
            return true;
        }
        console.log("no image");
    }
    return false;
}
