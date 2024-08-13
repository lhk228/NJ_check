const READY_CHECK = {
    data: { check: false },
    copyImg: { check: false },
    layer: { check: false },
};

$(function () {
    const { year, pnu } = getQueryParams();
    if (!year) {
        init();
    } else {
        init(year, pnu);
    }

    $(`#BTN_PNU`).click(function () {
        const pnu = $("#INPUT_PNU").val();
        window.location.href = `index.html?year=${year}&pnu=${pnu}`;
    });

    $(`#BTN_TYPE`).click(function () {
        const { year, pnu, type } = getQueryParams();

        var mapType = type === "farmmap" ? "base" : "farmmap";
        console.log("mapType:", mapType);

        window.location.href = `index.html?year=${year}&pnu=${pnu}&type=${mapType}`;
    });
    $(`#BTN_VECTOR`).click(function () {
        toggleVector();
    });

    $(`#BTN_YEAR`).click(function () {
        const year = 2019;
        window.location.href = `index.html?year=${year}&pnu=${pnu}`;
    });

    $(`#BTN_HIDE_UI`).click(function () {
        $(`.search-box`).toggle();
    });

    $(`#BTN_DOWNLOAD`).click(function () {
        convertCanvasImage("1");
        convertCanvasImage("2");
    });

    $(`#BTN_COPY_CANVAS`).click(function () {
        copyMapToCanvas("1");
        copyMapToCanvas("2");
    });

    $(`#BTN_LAYER_DOWNLOAD`).click(function () {
        convertLayerImage();
    });
});
