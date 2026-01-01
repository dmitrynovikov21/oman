const mammoth = require('mammoth');
const fs = require('fs');

mammoth.extractRawText({path: "../oman-kontent/report for court.docx"})
    .then(function(result){
        console.log(result.value);
    })
    .catch(function(err){
        console.error(err);
    });

