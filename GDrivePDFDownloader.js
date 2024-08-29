// ==UserScript==
// @name         Google Drive PDF Downloader
// @namespace    http://tampermonkey.net/
// @version      2024-03-10
// @description  Convert Image Blob into PDF
// @author       Xynogen
// @match        https://drive.google.com/file/d/*
// @icon         https://www.google.com/s2/favicons?sz=32&domain=xynogen.xyz
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Detect.js/2.2.2/detect.min.js
// ==/UserScript==

GM_addStyle ( `
     #myContainer {
        position:               absolute;
        top:                    0;
        right:                  0;
        margin-top:             10px;
        margin-right:           50px;
        opacity:                0.9;
        z-index:                1100;
        padding:                5px 20px;
    }

    .btn {
       background-color: DodgerBlue;
       border: none;
       color: white;
       padding: 12px 30px;
       cursor: pointer;
       font-size: 15px;
    }

   /* Darker background on mouse-over */
   .btn:hover {
       background-color: RoyalBlue;
    }
` );

function getFileExtension(filename) {
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}

function addDownload(onclick) {
    let fileName = document.querySelector('[itemprop=name]').content;
    if (getFileExtension(fileName) == "pdf" || getFileExtension(fileName) == "pptx") {
        let ua = detect.parse(navigator.userAgent);
        let btnContainer = document.createElement("div");

        if(ua.browser.family == "Chrome") {
            let escapeHTMLPolicy = trustedTypes.createPolicy("forceInner", {
                createHTML: (to_escape) => to_escape
            })
            btnContainer.innerHTML = escapeHTMLPolicy.createHTML("<button class='btn' type='button'>Download</button>");
        }else {
            btnContainer.innerHTML = "<button class='btn' type='button'>Download</button>";
        }

        btnContainer.setAttribute("id", "myContainer")
        document.body.appendChild(btnContainer);
        btnContainer.onclick = onclick;
    }
}

function generatePDF() {
    let elements = document.getElementsByTagName("img");
    let images = [];
    for (let i in elements) {
       let element = elements[i];
       if (/^blob:/.test(element.src)) {
          images.push(element);
       }
    }

    let orientation = "l";
    if (images[0].width < images[0].height) {
       orientation = "p";
    }

    let pdf = new jsPDF(orientation, 'pt', "a4");
    let fileName = document.querySelector('[itemprop=name]').content;
    let fileExtension = getFileExtension(fileName)
    let pdfName = `${fileName.replace(fileExtension, "")}pdf`;
    let pageWidth = pdf.internal.pageSize.width;
    let pageHeight = pdf.internal.pageSize.height;

    for (let i = 0; i < images.length; i++) {
        let img = images[i];

        let canvasElement = document.createElement('canvas');
        let con = canvasElement.getContext("2d");

        canvasElement.width = img.width;
        canvasElement.height = img.height;

        con.drawImage(img, 0, 0, img.width, img.height);

        let imgData = canvasElement.toDataURL("image/jpeg", 1.0);

        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

        if (i != images.length-1) {
            pdf.addPage();
        }
    }

    pdf.save(pdfName);
};


(function() {
    'use strict';
    addDownload(generatePDF);
})();

el.textContent = '';
const img = document.createElement('img');
img.src = 'xyz.jpg';
el.appendChild(img);


let body = document.getElementsByTagName("body")[0];
const jspdf_script = document.createElement("script");
jspdf_script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js";
body.appendChild(jspdf_script)
