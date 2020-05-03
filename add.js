let token = '';

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
    let previewer = new FileReader();
    previewer.onload = function (e) {
        let qrCodeImg = document.getElementById("qr-preview");
        qrCodeImg.src = e.target.result;
        qrCodeImg.style = "max-width: 150px; max-height: 150px";
    };
    previewer.readAsDataURL(qrCodeFile);
}

function getURL() {

}