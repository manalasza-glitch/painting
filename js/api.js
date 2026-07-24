const API_URL = "https://script.google.com/macros/s/AKfycbxglNkez35o5iiV0UxNRm0w_R3QesAGfOutj3TxysvHu4JPrtsFWnNxTMeiWAarnm22/exec";

async function sendData(data) {

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            body: JSON.stringify(data)

        });

        const result = await response.json();

        if (result.status === "success") {

            alert("บันทึกสำเร็จ");

        } else {

            alert(result.message);

        }

    } catch (err) {

        alert(err);

    }

}
