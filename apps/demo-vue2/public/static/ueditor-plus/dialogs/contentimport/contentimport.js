var contentImport = {};
var g = $G;

contentImport.data = {
    result: null,
};
contentImport.init = function (opt, callbacks) {
    addUploadButtonListener();
    addOkListener();
};

function processWord(file) {
    $('.file-tip').html(lang.wordConverting);
    $('.file-result').html('').hide();
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
        mammoth.convertToHtml({
            arrayBuffer: loadEvent.target.result
        })
            .then(function displayResult(result) {
                $('.file-tip').html(lang.convertSuccess);
                contentImport.data.result = result.value;
                $('.file-result').html(result.value).show();
            }, function (error) {
                $('.file-tip').html(lang.wordConvertFail + error);
            });
    };
    reader.onerror = function (loadEvent) {
        $('.file-tip').html(lang.wordConvertFail + loadEvent);
    };
    reader.readAsArrayBuffer(file);
}

function processMarkdown( markdown ){
    var converter = new showdown.Converter();
    var html = converter.makeHtml(markdown);
    $('.file-tip').html(lang.convertSuccess);
    contentImport.data.result = html;
    $('.file-result').html(html).show();
}

function processMarkdownFile(file) {
    $('.file-tip').html(lang.markdownConverting);
    $('.file-result').html('').hide();
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
        processMarkdown( loadEvent.target.result );
    };
    reader.onerror = function (loadEvent) {
        $('.file-tip').html(lang.markdownConvertFail + loadEvent);
    };
    reader.readAsText(file, "UTF-8");
}

function addUploadButtonListener() {
    g('contentImport').addEventListener('change', function () {
        var file = this.files[0];
        var fileName = file.name;
        var fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        switch (fileExt) {
            case 'docx':
            case 'doc':
                processWord(file);
                break;
            case 'md':
                processMarkdownFile(file);
                break;
            default:
                $('.file-tip').html(lang.unsupportedFormat + fileExt);
                break;
        }
    });
    g('fileInputConfirm').addEventListener('click', function () {
        processMarkdown( g('fileInputContent').value );
        $('.file-input').hide();
    });
}

function addOkListener() {
    dialog.onok = function () {
        if (!contentImport.data.result) {
            alert(lang.pleaseUploadFirst);
            return false;
        }
        editor.fireEvent('saveScene');
        editor.execCommand("inserthtml", contentImport.data.result);
        editor.fireEvent('saveScene');
    };
    dialog.oncancel = function () {
    };
}
