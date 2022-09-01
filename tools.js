// This is the file where I saved all the lagacy code that people wrote in the past.
// Maybe it will be useful in the future.
// I just keep it here for now.
// Huanzhi Mao



// ********** Helper functions related to cookie storage **********

// function createToken(token) {
//   if (navigator.cookieEnabled) {
//     createCookie("token", token, 1440);
//   } else {
//     createSession("token", token);
//   }
// }

// function readToken() {
//   if (navigator.cookieEnabled) {
//     return readCookie("token");
//   } else {
//     return readSession("token");
//   }
// }

// function deleteToken() {
//   deleteSession("token");
//   deleteCookie("token");
// }

// function createSession(name, value) {
//   sessionStorage.setItem(encodeURIComponent(name), encodeURIComponent(value));
// }

// function readSession(name) {
//   name = encodeURIComponent(name);
//   if (sessionStorage.hasOwnProperty(name)) {
//     return sessionStorage.getItem(name);
//   } else {
//     return null;
//   }
// }

// function deleteSession(name) {
//   name = encodeURIComponent(name);
//   if (sessionStorage.hasOwnProperty(name)) {
//     return sessionStorage.removeItem(name);
//   }
// }

// function createCookie(name, value, minutes) {
//   let date = new Date();
//   date.setTime(date.getTime() + minutes * 60 * 1000);
//   let expires = "; expires=" + date.toUTCString();
//   document.cookie =
//     encodeURIComponent(name) +
//     "=" +
//     encodeURIComponent(value) +
//     expires +
//     "; path=/";
// }

// function readCookie(name) {
//   name = encodeURIComponent(name) + "=";
//   for (c of document.cookie.split(";")) {
//     c = c.trim();
//     if (c.indexOf(name) === 0) {
//       return decodeURIComponent(c.substring(name.length, c.length));
//     }
//   }
//   return null;
// }

// function deleteCookie(name) {
//   let expires = "; expires = Thu, 01 Jan 1970 00:00:00 GMT";
//   document.cookie = encodeURIComponent(name) + "=/" + expires + "; path=/";
// }
