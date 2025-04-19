import {OpenApiGeneratorV31} from "@asteasolutions/zod-to-openapi";
import * as yaml from "yaml";
import * as fs from "fs";
import {Users} from "../users";

Users;
import {registerAuthPaths} from "./auth";
import {registerUsersPaths} from "./users";
import {registerSchoolsPaths} from "./schools";
import {registry} from "./registry";
import {registerStudentsPaths} from "./students";
import {registerProvidersPaths} from "./providers";
import {registerTherapistsPaths} from "./therapists";
import {registerTherapyServicesPaths} from "./therapy-services";
import {registerReportsPaths} from "./reports";
import {registerInvoicesPaths} from "./invoices";

registerUsersPaths();
registerAuthPaths();
registerSchoolsPaths();
registerStudentsPaths();
registerProvidersPaths();
registerTherapistsPaths();
registerTherapyServicesPaths();
registerReportsPaths();
registerInvoicesPaths();

const generator = new OpenApiGeneratorV31(registry.definitions);

const docs = generator.generateDocument({
    openapi: "3.1.0",
    info: {
        version: "1.0.0",
        title: "Testing Nirvana API",
    },
    servers: [{url: "api"}],
});

const fileContent = yaml.stringify(docs);

fs.writeFileSync(`${__dirname}/../../openapi.yml`, fileContent, {
    encoding: "utf-8",
});
