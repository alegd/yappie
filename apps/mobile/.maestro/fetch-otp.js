function requireApiUrl() {
  if (typeof API_URL !== "string" || API_URL.indexOf("http") !== 0) {
    throw new Error(
      "API_URL is not set. Run this flow through `npm run e2e:ui`, which derives it from " +
        "ipconfig getifaddr en0, or pass it explicitly with -e API_URL=http://<LAN_IP>:3011.",
    );
  }
  return API_URL;
}

function fetchOtp(baseUrl) {
  var url = baseUrl + "/api/v1/auth/_test/last-otp?email=" + EMAIL;
  for (var attempt = 0; attempt < 20; attempt++) {
    var response;
    try {
      response = http.get(url);
    } catch (error) {
      throw new Error(
        "Could not reach " +
          url +
          ". Is the e2e API running on " +
          baseUrl +
          "? " +
          "It must be the same address the Release build was compiled with " +
          "(EXPO_PUBLIC_API_URL). Underlying failure: " +
          error,
      );
    }
    if (response.ok) {
      return json(response.body).code;
    }
  }
  throw new Error("OTP not available at " + url + " after 20 attempts");
}

output.otp = fetchOtp(requireApiUrl());
