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

// Add custom styles for the download button
GM_addStyle(`
    #custom-container {
        position: absolute;
        top: 0;
        right: 0;
        margin-top: 10px;
        margin-right: 50px;
        opacity: 0.9;
        z-index: 1100;
        padding: 5px 20px;
    }
    .btn {
        background-color: DodgerBlue;
        border: none;
        color: white;
        padding: 12px 30px;
        cursor: pointer;
        font-size: 15px;
    }
    .btn:hover {
        background-color: RoyalBlue;
    }
`);

// Get file extension from filename
function getFileExtension(filename) {
    const match = /^.+\.([^.]+)$/.exec(filename);
    return match ? match[1] : "";
}

// Add download button if file extension is allowed
function addDownload(onClickHandler) {
    const allowedExtensions = ["pdf", "pptx"];
    const fileName = document.querySelector('[itemprop=name]').content;
    const isAllowedExtension = allowedExtensions.includes(getFileExtension(fileName));

    if (isAllowedExtension) {
        const userAgent = detect.parse(navigator.userAgent);
        const btnContainer = document.createElement("div");
        const buttonHTML = "<button class='btn' type='button'>Download</button>";

        if (userAgent.browser.family === "Chrome" && window.trustedTypes) {
            const escapeHTMLPolicy = trustedTypes.createPolicy("forceInner", {
                createHTML: to_escape => to_escape
            });
            btnContainer.innerHTML = escapeHTMLPolicy.createHTML(buttonHTML);
        } else {
            btnContainer.innerHTML = buttonHTML;
        }

        btnContainer.id = "custom-container";
        document.body.appendChild(btnContainer);
        btnContainer.addEventListener('click', onClickHandler);
    }
}

// Generate PDF from image blobs
function generatePDF() {
    const images = Array.from(document.getElementsByTagName("img")).filter(img => /^blob:/.test(img.src));

    if (images.length === 0) return;

    const orientation = images[0].width < images[0].height ? "p" : "l";
    const pdf = new jsPDF(orientation, 'pt', "a4");
    const fileName = document.querySelector('[itemprop=name]').content;
    const fileExtension = getFileExtension(fileName);
    const pdfName = `${fileName.replace(new RegExp(`\\.${fileExtension}$`), "")}.pdf`;

    images.forEach((img, index) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        context.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const { width: pageWidth, height: pageHeight } = pdf.internal.pageSize;

        const aspectRatio = canvas.width / canvas.height;
        let imgWidth, imgHeight;
        if (pageWidth / pageHeight < aspectRatio) {
            imgWidth = pageWidth;
            imgHeight = imgWidth / aspectRatio;
        } else {
            imgHeight = pageHeight;
            imgWidth = imgHeight * aspectRatio;
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        if (index < images.length - 1) {
            pdf.addPage();
        }
    });

    pdf.save(pdfName);
}

// Initialize the script
(function() {
    'use strict';
    addDownload(generatePDF);
})();