import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY!;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface RecaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

// Endpoint para validar o token reCAPTCHA
app.post("/validate-recaptcha", async (req: Request, res: Response) => {
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
