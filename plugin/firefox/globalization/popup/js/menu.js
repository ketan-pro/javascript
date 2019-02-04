function reportError(error) {
    console.error(`Could not run: ${error}`);
}
function takeScreenShot() {
    browser.tabs.captureVisibleTab().then((imgUrl) => {
        download(imgUrl, 'screen_' + (new Date().getMilliseconds()) + '.png', 'image/png');
    }, reportError);
}

function markAll() {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(curTab => {
            browser.tabs.sendMessage(curTab[0].id, {
                command: "markAll"
            });
        }).catch(reportError);
}

function uploadXls(fileList) {
    for (i = 0; i < fileList.length; i++) {
        var file = fileList[i];

        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
        if (regex.test(file.value.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
 
                //For Browsers other than IE.
                if (reader.readAsBinaryString) {
                    reader.onload = function (e) {
                        ProcessExcel(e.target.result);
                    };
                    reader.readAsBinaryString(file);
                } else {
                    //For IE Browser.
                    reader.onload = function (e) {
                        var data = "";
                        var bytes = new Uint8Array(e.target.result);
                        for (var i = 0; i < bytes.byteLength; i++) {
                            data += String.fromCharCode(bytes[i]);
                        }
                        ProcessExcel(data);
                    };
                    reader.readAsArrayBuffer(file);
                }
            } else {
                alert("This browser does not support HTML5.");
            }
        } else {
            alert("Please upload a valid Excel file.");
        }
    }
}

function ProcessExcel(data) {
    //Read the Excel File data.
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    //Fetch the name of First Sheet.
    var firstSheet = workbook.SheetNames[0];

    //Read all rows from First Sheet into an JSON array.
    var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);

    //Create a HTML Table element.
    var table = document.createElement("table");
    table.border = "1";

    //Add the header row.
    var row = table.insertRow(-1);

    //Add the header cells.
    var headerCell = document.createElement("TH");
    headerCell.innerHTML = "Id";
    row.appendChild(headerCell);

    headerCell = document.createElement("TH");
    headerCell.innerHTML = "Name";
    row.appendChild(headerCell);

    headerCell = document.createElement("TH");
    headerCell.innerHTML = "Country";
    row.appendChild(headerCell);

    //Add the data rows from Excel file.
    for (var i = 0; i < excelRows.length; i++) {
        //Add the data row.
        var row = table.insertRow(-1);

        //Add the data cells.
        var cell = row.insertCell(-1);
        cell.innerHTML = excelRows[i].Id;

        cell = row.insertCell(-1);
        cell.innerHTML = excelRows[i].Name;

        cell = row.insertCell(-1);
        cell.innerHTML = excelRows[i].Country;
    }

    var dvExcel = document.getElementById("dvExcel");
    dvExcel.innerHTML = "";
    dvExcel.appendChild(table);
};

browser.tabs.executeScript({ file: "/scripts/highlighter.js" });
browser.tabs.executeScript({ file: "/scripts/injector.js" });