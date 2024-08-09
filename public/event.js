const READY_CHECK = {
    data: { check: false },
    copyImg: { check: false },
    layer: { check: false, link: "" },
    img: { check: false, link: "" },
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

// URL의 쿼리 문자열을 읽어오는 함수
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        year: params.get("year"),
        pnu: params.get("pnu"),
        type: params.get("type"),
    };
}

//레이어 이미지 저장
async function convertLayerImage() {
    const link = await html2canvas(document.querySelector("#mapDiv1"), {
        backgroundColor: null, // 투명 배경 설정
    }).then((canvas) => {
        // 캔버스를 이미지로 변환
        var image = canvas.toDataURL("image/png");
        if (!image) {
            return false;
        }
        return image;
    });
    READY_CHECK.layer.link = link;

    return true;
}

//맵 캔버스에 복사
async function copyMapToCanvas(target) {
    READY_CHECK.copyImg.check = false;

    const mapContainer = document.getElementById("mapDiv" + target);
    const mapCanvas = document.getElementById("mapCanvas" + target);
    const mapContext = mapCanvas.getContext("2d");

    // 지도 컨테이너의 크기로 캔버스 크기 설정
    mapCanvas.width = mapContainer.offsetWidth;
    mapCanvas.height = mapContainer.offsetHeight;

    // 모든 캔버스 요소를 찾습니다
    const canvases = mapContainer.querySelectorAll(".olTileImage");

    // Promise.all을 사용하여 모든 이미지 처리를 병렬로 수행
    await Promise.all(
        Array.from(canvases).map(async (canvas) => {
            const imgUrl = canvas.src;
            try {
                const result = await convertImgToBase64({ imgUrl });
                const base64 = result.data.imgBase64;

                // base64를 이미지로 변환
                const img = new Image();
                img.src = "data:image/png;base64," + base64;

                await new Promise((resolve) => {
                    img.onload = () => {
                        // 캔버스의 위치 정보를 가져옵니다
                        const rect = canvas.getBoundingClientRect();
                        const containerRect = mapContainer.getBoundingClientRect();

                        // 컨테이너를 기준으로 한 상대적 위치 계산
                        const x = rect.left - containerRect.left;
                        const y = rect.top - containerRect.top;

                        // 새 캔버스에 이미지 그리기
                        mapContext.drawImage(img, x, y, canvas.width, canvas.height);
                        resolve();
                    };
                });
            } catch (error) {
                console.error("이미지 변환 중 오류 발생:", error);
                return false;
            }
        })
    );
    return true;
}

//base64 이미지로 변환(세탁)
function convertImgToBase64(url) {
    const result = axios.post("http://127.0.0.1:5501/baseImg", url);
    return result;
}

//캔버스 이미지 변환
async function convertCanvasImage(target) {
    var canvas = document.getElementById("mapCanvas" + target);

    // canvas를 이미지로 변환
    let imageDataURL;

    try {
        imageDataURL = canvas.toDataURL("image/png");
    } catch (e) {
        console.log("캔버스 이미지 변환 실패:", e);
        return false;
    }
    READY_CHECK.img.link = imageDataURL;

    return true;
}

//이미지 다운로드 동기처리
let layerImageDownloaded = false; // 레이어 이미지 다운로드 여부를 추적하는 전역 변수
async function handleMapDownload(target) {
    try {
        const checkCopy = await copyMapToCanvas(target);
        const checkImage = await convertCanvasImage(target);

        // 레이어 이미지 변환 (한 번만 수행)
        if (!layerImageDownloaded) {
            const checkLayer = await convertLayerImage();
            READY_CHECK.layer.check = checkLayer;
        }

        READY_CHECK.copyImg.check = checkCopy;
        READY_CHECK.img.check = checkImage;

        return true;
    } catch (error) {
        $(`[name='img-download']`).val("F");
        console.error("맵 다운로드 중 오류 발생:", error);
        return false;
    }
}
