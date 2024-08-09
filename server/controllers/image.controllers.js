import axios from "axios";

// 이미지 URL을 Base64로 인코딩하는 함수
export default async function encodeImageUrlToBase64(imageUrl) {
    try {
        // 이미지 URL에서 데이터 다운로드
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" }).catch(function (error) {
            console.log(error.toJSON());
        });
        const imageBuffer = Buffer.from(response.data, "binary");
        // Base64로 인코딩
        return imageBuffer.toString("base64");
    } catch (error) {
        console.error("Error downloading or encoding image:", error);
        throw error;
    }
}
