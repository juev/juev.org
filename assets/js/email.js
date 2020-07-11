var els = document.getElementsByTagName('a'), i = 0, code;

for(i; i < els.length; i++) {
    prop = els[i].getAttribute('itemprop');
    if(prop == 'email') {
        code = els[i];
        break;
    }
}

updateAnchor(code);

function updateAnchor(el) {
    // fetch the hex-encoded string
    var encoded = el.dataset.code;

    // decode the email, using the decodeEmail() function from before
    var decoded = decodeEmail(encoded);

    // Set the link to be a "mailto:" link
    el.href = 'mailto:' + decoded;
}

function decodeEmail(encodedString) {
    // Holds the final output
    var email = "";

    // Extract the first 2 letters
    var keyInHex = encodedString.substr(0, 2);

    // Convert the hex-encoded key into decimal
    var key = parseInt(keyInHex, 16);

    // Loop through the remaining encoded characters in steps of 2
    for (var n = 2; n < encodedString.length; n += 2) {

        // Get the next pair of characters
        var charInHex = encodedString.substr(n, 2)

        // Convert hex to decimal
        var char = parseInt(charInHex, 16);

        // XOR the character with the key to get the original character
        var output = char ^ key;

        // Append the decoded character to the output
        email += String.fromCharCode(output);
    }
    return email;
}
