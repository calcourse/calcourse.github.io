var token = '';

$(() => {
    $.ajax({
        type: 'POST',
        url: "http://118.25.79.158:3000/api/v1/auth/",
        contentType: 'application/json',
        dataType: 'json',
        data: {
            email: "oski@berkeley.edu",
        },
        success: (response) => {
            token = concat(response.token);
            console.log(response);
        },
        error: (response) => {
            console.log(response);
        },
    })
});

function submitInfo() {
    $.ajax({
        type: 'POST',
        url: 'http://118.25.79.158:3000/api/v1/courses/',
        headers: {
            'Authorization': 'Bearer: ' + token,
        },
        contentType: 'application/json',
        dataType: 'json',
        data: {
            code: $("#course-code").val(),
            name: $("#course-name").val(),
            // TODO: a check need to be performed somewhere
            qr_code: (getURL()),
        },
        success: (response) => {
            console.log(response);
        },
        error: (response) => {
            console.log(response);
        },
    })
}

function loadPreview() {
    let qrCodeFile = document.getElementById('qr').files[0];
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
        // TODO: Now loading img_data might require clicking twice and idk waht's going on
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
