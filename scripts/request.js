let api = "https://j2xnmuiw4k.execute-api.us-west-1.amazonaws.com/CalCourse";
let cookiesLoaded = false;
let helpLoaded = false;
let term = undefined;
let course_entries = []

$(() => {
    let token = readUserEmail();
    let email = readUserToken();

    if (!(token && email && checkValidToken())) {
        window.location.href = "index.html?redirect=request";
    } 

    $(".about-toggle").on("click", () => {
        $("#about-container").toggleClass("hidden");
    });

    $(".cookies-toggle").on("click", () => {
        if (!cookiesLoaded) {
            $("#cookies-page-container").load("policy.html");
            cookiesLoaded = true;
        }
        $("#cookies-container").toggleClass("hidden");
    });
    
    $(".help-toggle").on("click", () => {
        if (!helpLoaded) {
            $("#help-page-container").load("help.html");
            cookiesLoaded = true;
        }
        $("#help-container").toggleClass("hidden");
    });
});

let entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function logSubmission(term) {
    if(!navigator.cookieEnabled) {
        createCookie(term, 'true', 1440);
    }
    else {
        createSession(term, 'true');
        console.log(readSession(term));
    }
}

function readLog(term) {
    if (readCookie(term) || readSession(term)) {
        return true;
    } else {
        return null;
    }
}

// function readToken() {
//     if(navigator.cookieEnabled) {
//         return readCookie("token");
//     }
//     else {
//         return readSession("token");
//     }
// }

function createSession(name, value) {
    sessionStorage.setItem(encodeURIComponent(name), encodeURIComponent(value));
}

function readSession(name) {
    name = encodeURIComponent(name);
    if (sessionStorage.hasOwnProperty(name)) {
        return sessionStorage.getItem(name);
    } else {
        return null;
    }
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

function errorAlert(msg) {
    let request_description = $("#request-description");
    request_description.text('\u26A0 ' + msg);
    request_description.css('color', '#FBEC5D');
    request_description.addClass("shake").on("animationend", function(e) {
        $(this).removeClass('shake').off("animationend");
    });
    $("#submit-button").removeClass('submit-button-default').addClass('submit-button-error');
}

function errorRestore() {
    let request_description = $("#request-description");
    request_description.text("申请建群");
    request_description.css('color', '#FFFFFF');
    $("#submit-button").removeClass('submit-button-error').addClass('submit-button-default');
}

function confirmAlert() {
    $("#request-description").text("\u26A0 请确认输入的课程信息是否正确");
}

function submitSuccessAlert() {
    $("#submit-ani").slideUp(500, function () {
        $(this).remove();
        let request_description = $("#request-description");
        request_description.text("\u2713 提交成功！");
        request_description.css('color', '#77DD77');
    });
}

function termErrorAlert() {
    errorAlert("请选择学期");
    $("#term-container").removeClass("term-default").addClass("term-error");
}

function termErrorRestore() {
    $("#term-container").removeClass("term-error").addClass("term-default");
    errorRestore();
}

function inputErrorAlert(input_id) {
    $(input_id).removeClass('course-input-default').addClass('course-input-error');
}

function inputErrorRestore(input_id) {
    $(input_id).removeClass('course-input-error').addClass('course-input-default');
}

function toggleTerm() {
    if ($("#request-description").text() === "\u26A0 已达到该学期一天内最大提交次数") {
        errorRestore();
    }
}

function isEmpty(value) {
    if (!value) {
        return true;
    } else return value.replace(/(^s*)|(s*$)/g, "").length === 0;
}

function isIllegal(FLAG, value) {
    switch (FLAG) {
        case "DEP_CODE":
            let depCodeReg = /^[a-zA-Z]+$/
            return !(depCodeReg.test(value) && value.length < 11);
        case "NUM_CODE":
            let numCodeReg = /^[a-zA-Z]?[0-9]+[a-zA-Z]*$/
            return !(numCodeReg.test(value) && value.length < 11);
        case "LEC_CODE":
            let lecCodeReg = /^[0-9]{1,3}$/
            return !(lecCodeReg.test(value));
    }
}

function checkNonemptyAndLegal(FLAG, value) {
    if (isEmpty(value)) {
        return false;
    } else return !isIllegal(FLAG, value);
}

function completeDepCode(value) {
    if (value = "CS") {
        return "COMPSCI";
    }
    else if (value = "NST") {
        return "NUSCTX";
    }
    else if (value = "ENG") {
        return "ENGLISH";
    }
    else if (value = "DS") {
        return "DATA";
    }
    else if (value = "BIO") {
        return "BIOLOGY";
    }
    else if (value = "MCB") {
        return "MCELLBI";
    }
    else if (value = "IB") {
        return "INTEGBI";
    }
    else if (value = "PHYSIC") {
        return "PHYSICS";
    }
    else return value;
}

function completeLecCode(value) {
    return "0".repeat(3 - value.length) + value;
}

function cleanLowerCase(value) {
    value = value.replaceAll("a", "A");
    value = value.replaceAll("b", "B");
    value = value.replaceAll("c", "C");
    value = value.replaceAll("d", "D");
    value = value.replaceAll("e", "E");
    value = value.replaceAll("f", "F");
    value = value.replaceAll("g", "G");
    value = value.replaceAll("h", "H");
    value = value.replaceAll("i", "I");
    value = value.replaceAll("j", "J");
    value = value.replaceAll("k", "K");
    value = value.replaceAll("l", "L");
    value = value.replaceAll("m", "M");
    value = value.replaceAll("n", "N");
    value = value.replaceAll("o", "O");
    value = value.replaceAll("p", "P");
    value = value.replaceAll("q", "Q");
    value = value.replaceAll("r", "R");
    value = value.replaceAll("s", "S");
    value = value.replaceAll("t", "T");
    value = value.replaceAll("u", "U");
    value = value.replaceAll("v", "V");
    value = value.replaceAll("w", "W");
    value = value.replaceAll("x", "X");
    value = value.replaceAll("y", "Y");
    value = value.replaceAll("z", "Z");
    return value;
}

function inputClean(FLAG, input_id, entry) {
    entry = entry.toUpperCase();
    switch (FLAG) {
        case "DEP_CODE":
            switch (entry) {
                case "CS":
                    entry = "COMPSCI";
                    break;
                case "NST":
                    entry = "NUSCTX";
                    break;
                case "ENG":
                    entry = "ENGLISH";
                    break;
                case "DS":
                    entry = "DATA";
                    break;
                case "BIO":
                    entry = "BIOLOGY";
                    break;
                case "MCB":
                    entry = "MCELLBI";
                    break;
                case "IB":
                    entry = "INTEGBI";
                    break;
                case "PHYSIC":
                    entry = "PHYSICS";
                    break;
                default:
                    break;
            }
            break;
        case "NUM_CODE":
            break;
        case "LEC_CODE":
            entry = '0'.repeat(3 - entry.length) + entry
            break;
    }
    $(input_id).val(entry);
}

function submit() {
    let term_entry = $("input[name='term']:checked").data("term");
    if(!term_entry) {
        termErrorAlert();
        return undefined;
    }
    term = term_entry;
    termErrorRestore();
    if (readLog(term)) {
        errorAlert("已达到该学期一天内最大提交次数");
        return undefined;
    }
    let course_containers = [];
    for (let i = 1; i < 2; i++){
        course_containers.push(`#course${i}-container`);
    }
    course_entries = [];
    let READY_FLAG = true;
    for (let i = 0; i < course_containers.length; i++){
        let course_dep_input = course_containers[i] + " .course-dep-code";
        let course_code_input = course_containers[i] + " .course-num-code";
        let course_lec_input = course_containers[i] + " .course-lec-code";
        let dep_entry = $(course_dep_input).val();
        let code_entry = $(course_code_input).val();
        let lec_entry = $(course_lec_input).val();
        if (isEmpty(dep_entry) && isEmpty(code_entry) && isEmpty(lec_entry)) {
            continue;
        }
        if (!checkNonemptyAndLegal("DEP_CODE", dep_entry)) {
            inputErrorAlert(course_dep_input);
            READY_FLAG = false;
        } else {
            inputErrorRestore(course_dep_input);
            inputClean("DEP_CODE", course_dep_input, dep_entry);
        }
        if (!checkNonemptyAndLegal("NUM_CODE", code_entry)) {
            inputErrorAlert(course_code_input);
            READY_FLAG = false;
        } else {
            inputErrorRestore(course_code_input);
            inputClean("NUM_CODE", course_code_input, code_entry);
        }
        if (!checkNonemptyAndLegal("LEC_CODE", lec_entry)) {
            inputErrorAlert(course_lec_input);
            READY_FLAG = false;
        } else {
            inputErrorRestore(course_lec_input);
            inputClean("LEC_CODE", course_lec_input, lec_entry);
        }
        course_entries.push({dep: dep_entry, code: code_entry, lec: lec_entry, term: term});
    }
    if (!READY_FLAG) {
        errorAlert("请输入正确的课程信息");
        return undefined;
    } else {
        errorRestore();
    }
    if (course_entries.length === 0) {
        inputErrorAlert(course_containers[0] + " .course-dep-code");
        inputErrorAlert(course_containers[0] + " .course-num-code");
        inputErrorAlert(course_containers[0] + " .course-lec-code");
        errorAlert("请至少填写一个课程");
        return undefined;
    }
    displayConfirmSubmit();
}

function displayConfirmSubmit() {
    $("#request-wrapper input").prop("disabled", true);
    $("#term-container label").css("cursor", "default");
    confirmAlert();
    $("#submit-button").hide();
    $("#edit-button").show();
    $("#confirm-button").show();
}

function edit() {
    $("#request-wrapper input").prop("disabled", false);
    $("#term-container label").css("cursor", "pointer");
    errorRestore();
    $("#edit-button").hide();
    $("#confirm-button").hide();
    $("#submit-button").show();
}

function confirmSubmit() {
    console.log(JSON.stringify(course_entries));
    $("#edit-button").hide();
    $("#confirm-button").hide();
    $("#request-description").text("正在提交");
    $("#submit-botton-container").append(
        `<div id="submit-ani" class="load-ani">
            <div></div><div></div><div></div><div></div>
        </div>`);
    let dep_code = course_entries[0]["dep"];
    dep_code = cleanLowerCase(dep_code);
    console.log("clean lower")
    console.log(dep_code);
    
    dep_code = completeDepCode(dep_code);
    console.log("complete");
    console.log(dep_code);

    let course_code = course_entries[0]["code"];
    let lec_id = course_entries[0]["lec"];
    lec_id = completeLecCode(lec_id);
    let course_term = course_entries[0]["term"];
    console.log(dep_code, course_code, lec_id, course_term);
    $.ajax({
      type: "POST",
      url: api + "/courses/report_missing_class",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        department_code: dep_code,
        course_code: course_code,
        lecture_id: lec_id,
        course_term: course_term,
      }),
        success: (response) => {
        console.log(response);
        submitSuccessAlert();
        logSubmission(term);
      },
      error: (response) => {
        console.log(response);
        $("#submit-ani").remove();
        displayConfirmSubmit();
        errorAlert("上传失败, 请重试");
      },
    });
}


function readUserEmail() {
  return localStorage.getItem("user_email");
}

function readUserToken() {
  return localStorage.getItem("user_token");
}

function readUserTokenTime() {
  let token_time_data = localStorage.getItem("user_token_time");
  if (token_time_data) {
    return JSON.parse(token_time_data);
  } else {
    return null;
  }
}

function checkValidToken() {
  let timeList = readUserTokenTime();
  if (timeList == null) {
    return false;
  }
  let currentTime = new Date();
  let currentTimeUTC = Data.UTC(
    currentTime.getUTCFullYear(),
    currentTime.getUTCMonth(),
    currentTime.getUTCDate(),
    currentTime.getUTCHours()
  );
  let tokenTimeUTC = Data.UTC(
    timeList[0],
    timeList[1],
    timeList[2],
    timeList[3]
  );
  let diff_ms = currentTimeUTC - tokenTimeUTC;
  // token is valid for 6 hours
  let diff_hours = diff_ms / 1000 / 60 / 60;
  if (diff_hours <= 6) {
    return true;
  }
  return false;
}