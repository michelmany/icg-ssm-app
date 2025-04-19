import express from "express";
import {UserApi} from "./users";
import {AuthApi} from "./auth";
import {Api} from "./api";
import {SchoolsApi} from "./schools";
import {PermissionsMiddleware} from "./role";
import {Emails} from "../emails";
import {RateLimit} from "./rate-limit";
import {StudentsApi} from "./students";
import {ProvidersApi} from "./providers";
import {TherapistsApi} from "./therapists";
import {TherapyServicesApi} from "./therapy-services";
import {ReportsApi} from "./reports";
import {InvoicesApi} from "./invoices";

const app = express();

app.use(express.json());
app.use(RateLimit.middleware);

app.use("/auth", AuthApi.route);
app.use(AuthApi.middleware);
app.use("/roles", PermissionsMiddleware.route);
app.use("/users", UserApi.route);
app.use("/schools", SchoolsApi.route);
app.use("/students", StudentsApi.route);
app.use("/providers", ProvidersApi.route);
app.use("/therapists", TherapistsApi.route);
app.use("/therapy-services", TherapyServicesApi.route);
app.use("/reports", ReportsApi.route);
app.use("/invoices", InvoicesApi.route);

app.use(Api.errorHandler);
app.use((req, res, next) => {
    res.status(404).json({message: "Not Found."});
});

export default app;
