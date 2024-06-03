import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import "dotenv/config";
import serverless from "serverless-http";
import cors from "cors";

const app = express();
const router = express.Router();
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY!;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface RecaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}
const corsOptions = {
  origin: "https://metamatch.com.br",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
router.use(cors(corsOptions));

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://metamatch.com.br");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://metamatch.com.br");
  res.send();
});

router.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});
// Endpoint para validar o token reCAPTCHA
router.post("/validate-recaptcha", async (req: Request, res: Response) => {
  const token = req.body.token;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`,
      {
        method: "POST",
      }
    );

    const data = (await response.json()) as RecaptchaResponse;

    if (data.success) {
      res.json({ success: true, message: "Token is valid" });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid token",
        "error-codes": data["error-codes"],
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app);

export default {
  handler: serverless(app),
};
