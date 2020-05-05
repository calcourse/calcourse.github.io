window.onload = function() {
    /*   DEBUG   */
    // createCookie("token", "hilfinger", 10);
    /* END DEBUG */

    let token = readCookie("token");

    if (token) {
        loginSuccess(token);
    } else {
        gapi.load('auth2', () => {
            auth2 = gapi.auth2.init({
                client_id: '707915550129-7l94p2dpplaoub3d6clhrjpivki6dqpe.apps.googleusercontent.com',
                cookiepolicy: 'single_host_origin'
            });
            auth2.attachClickHandler($("#login-button")[0], {}, onSignIn, (error) => {
                if (error.error.indexOf("closed by user") === -1) {
                    document.getElementById("login-msg").textContent = "Login Failed.";
                    console.log(error.error);
                }
            });
        });
    }
};

function loginSuccess(token) {
    document.getElementById("login-msg").textContent = "Login Success, Redirecting...";
    setTimeout(() => {window.location.href = "index.html";}, 5000)

}

function createCookie(name, value, minutes) {
    let date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    let expires = "; expires=" + date.toUTCString();
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
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

function onSignIn(googleUser) {
    let profile = googleUser.getBasicProfile();
    let email = profile.getEmail();
    $.ajax({url: api + "auth/", type: "POST",
        data: {email: email}, success: (response) => {
            let token = response.token;
            createCookie("token", token, 10);
            loginSuccess(token);
        }, error: (response) => {
            alert("Cannot verify your student identity, please use '.berkeley.edu' email.");
        }});
}
