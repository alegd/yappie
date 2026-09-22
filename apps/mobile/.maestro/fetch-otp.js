function fetchOtp() {
  for (var attempt = 0; attempt < 20; attempt++) {
    var response = http.get(API_URL + '/api/v1/auth/_test/last-otp?email=' + EMAIL);
    if (response.ok) {
      return json(response.body).code;
    }
  }
  throw new Error('OTP not available at ' + API_URL + ' for ' + EMAIL);
}

output.otp = fetchOtp();
