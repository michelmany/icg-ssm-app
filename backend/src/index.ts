import app from "./api/app";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

const PORT = 8889;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
