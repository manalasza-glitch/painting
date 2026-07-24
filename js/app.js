window.onload = () => {

    document.getElementById("date").valueAsDate = new Date();

}

function saveData(){

    const data = {

        date: document.getElementById("date").value,

        rust: Number(document.getElementById("rust").value),

        dent: Number(document.getElementById("dent").value),

        weld: Number(document.getElementById("weld").value),

        chemical: Number(document.getElementById("chemical").value),

        oil: Number(document.getElementById("oil").value),

        note: document.getElementById("note").value

    };

    sendData(data);

}
