import express from "express";
import path from "path";
import cors from "cors";
import imageController from "./controllers/image.controllers.js";
import { fileURLToPath } from "url";

// __dirname을 ES 모듈에서 사용하기 위해 추가
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgApp = express();
const IMGSERVER_PORT = 5501;

imgApp.use(express.json());
imgApp.use(cors());

imgApp.get("/", (req, res, next) => {
    res.send("이미지 서버 호출 테스트");
});
imgApp.post("/baseImg", async (req, res, next) => {
    try {
        const imageUrl = req.body.imgUrl;
        const imageBase64 = await imageController(imageUrl);
        return res.status(200).json({
            imgBase64: imageBase64,
        });
    } catch (error) {
        console.log("hihi");
        return res.json({ message: error.message });
    }
});

imgApp.listen(IMGSERVER_PORT, () => {
    console.log(`IMG SERVER PORT http://localhost:${IMGSERVER_PORT}`);
});
