#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (query) => {
  return new Promise((resolve) => {
    rl.question(`${query}: `, (answer) => {
      resolve(answer);
    });
  });
};

// Helper function to ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Helper function to capitalize first letter
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to create singular form
const singularize = (str) => {
  // This is a simplified version, you might want to use a library like pluralize
  if (str.endsWith('s')) {
    return str.slice(0, -1);
  }
  return str;
};

// Create file if not exists, or append if specified section exists
const createOrUpdateFile = (
  filePath,
  content,
  isNew = true,
  insertionPoint = '',
  appendAfter = true
) => {
  try {
    if (isNew || !fs.existsSync(filePath)) {
      ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, content);
      console.log(`Created file: ${filePath}`);
    } else {
      let fileContent = fs.readFileSync(filePath, 'utf8');

      if (insertionPoint) {
        const position = fileContent.indexOf(insertionPoint);

        if (position !== -1) {
          const insertPosition = appendAfter
            ? position + insertionPoint.length
            : position;

          const newContent = fileContent.slice(0, insertPosition) +
                            content +
                            fileContent.slice(insertPosition);

          fs.writeFileSync(filePath, newContent);
          console.log(`Updated file: ${filePath}`);
        } else {
          console.error(`Insertion point not found in ${filePath}`);
        }
      } else {
        fs.writeFileSync(filePath, content);
        console.log(`Replaced file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

// Generate index.ts content
const generateIndexTs = (
  name,
  entityName,
  capitalizedName,
  modelNameSingular,
  capitalizedNamePlural,
  fieldDefinitions,
  uppercaseName
) => {
  // Create imports for any enum types
  const enumImports = fieldDefinitions
    .filter(field => field.isEnum && field.isRelation)
    .map(field => field.relationModel)
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(model => `import {${model}} from "../${model.toLowerCase()}";`);

  // Generate enum type strings for any local enums
  const localEnumTypes = fieldDefinitions
    .filter(field => field.isEnum && !field.isRelation)
    .map(field => {
      const enumValues = (field.enumValues || []).map(v => `        ${v} = "${v}",`).join('\n');
      return `
    export enum Type {
${enumValues}
    }`;
    }).join('\n');

  // Generate the Info schema
  const infoSchemaFields = fieldDefinitions.map(field => {
    if (field.isEnum && field.isRelation) {
      return `        ${field.name}: z.nativeEnum(${field.relationModel}.${field.type}),`;
    } else if (field.isEnum) {
      return `        ${field.name}: z.nativeEnum(Type),`;
    } else if (field.type === 'string') {
      return `        ${field.name}: z.string(),`;
    } else if (field.type === 'number') {
      return `        ${field.name}: z.number(),`;
    } else if (field.type === 'boolean') {
      return `        ${field.name}: z.boolean(),`;
    } else if (field.type === 'date') {
      return `        ${field.name}: z.date(),`;
    } else if (field.type === 'uuid') {
      return `        ${field.name}: z.string().uuid(),`;
    } else {
      return `        ${field.name}: z.string(),`;
    }
  }).join('\n');

  // Generate relation includes in the find method
  const relationFields = fieldDefinitions
    .filter(field => field.isRelation)
    .map(field => field.name);

  const includeRelations = relationFields.length > 0
    ? `                include: {
                    ${relationFields.join(': true,\n                    ')}: true,
                },`
    : '';

  // Generate relation serialization
  const serializeRelations = relationFields.map(relation => `
        ${relation}: ${modelNameSingular}.${relation} ? {
            id: ${modelNameSingular}.${relation}.id,
            name: ${modelNameSingular}.${relation}.name,
            // Add other fields as needed
        } : undefined,`).join('\n');

  return `import {z} from "zod";
import {prisma} from "../db";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, ${capitalizedName} as Prisma${capitalizedName}} from "@prisma/client";
import {Activity} from "../activity";
${enumImports.join('\n')}

export namespace ${capitalizedNamePlural} {${localEnumTypes}

    export const Info = z.object({
        id: z.string().uuid(),
${infoSchemaFields}
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const ${modelNameSingular} = await prisma.${name}.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },${includeRelations}
            });

            return serialize(${modelNameSingular});
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("${entityName} not found.", {
                    code: "${uppercaseName}_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        // Add your list parameters here
        sortBy: z
            .enum([
                "createdAt",
                "updatedAt"
                // Add other sortable fields
            ])
            .optional()
            .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.${capitalizedName}WhereInput => {
        const where: Prisma.${capitalizedName}WhereInput = {
            deletedAt: null,
        };

        return where;
    };

    const buildSort = (filter: z.infer<typeof listParams>) => {
        const {sortBy, sortOrder} = filter;
        return {[sortBy]: sortOrder};
    };

    export const list = async (filter: z.infer<typeof listParams>) => {
        const skip = (filter.page - 1) * filter.perPage;
        const take = filter.perPage;

        const where = buildWhere(filter);
        const orderBy = buildSort(filter);

        const [${name}, total] = await prisma.$transaction([
            prisma.${name}.findMany({
                where,
                skip,
                take,
                orderBy,${includeRelations}
            }),
            prisma.${name}.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: ${name}.map(serialize),
            pagination,
        };
    };

    export const createData = z.object({
        // Add your required fields for creation
${fieldDefinitions
  .filter(field => field.isRequired && field.name !== 'id' && !field.name.includes('At'))
  .map(field => {
    if (field.isEnum && field.isRelation) {
      return `        ${field.name}: z.nativeEnum(${field.relationModel}.${field.type}),`;
    } else if (field.isEnum) {
      return `        ${field.name}: z.nativeEnum(Type),`;
    } else if (field.type === 'uuid') {
      return `        ${field.name}: z.string().uuid(),`;
    } else if (field.type === 'string') {
      return `        ${field.name}: z.string(),`;
    } else if (field.type === 'number') {
      return `        ${field.name}: z.number(),`;
    } else if (field.type === 'boolean') {
      return `        ${field.name}: z.boolean(),`;
    } else {
      return `        ${field.name}: z.string(),`;
    }
  })
  .join('\n')}
    });

    export const create = async (
        data: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        const {id} = await prisma.${name}.create({
            data,
        });

        Activity.log({
            context,
            action: Activity.Action.CREATE_${uppercaseName},
            subjectId: id,
        });

        return id;
    };

    export const updateData = createData.partial();

    export const update = async (
        {id, ...updates}: z.infer<typeof findParams> & z.infer<typeof updateData>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.${name}.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: updates,
            });

            Activity.log({
                context,
                action: Activity.Action.UPDATE_${uppercaseName},
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("${entityName} not found.", {
                    code: "${uppercaseName}_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const remove = async (
        {id}: z.infer<typeof findParams>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.${name}.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: {
                    deletedAt: new Date(),
                },
            });

            Activity.log({
                context,
                action: Activity.Action.DELETE_${uppercaseName},
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("${entityName} not found.", {
                    code: "${uppercaseName}_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (${modelNameSingular}: Prisma${capitalizedName} & {
        ${relationFields.map(relation => `${relation}?: any;`).join('\n        ')}
    }) => ({
        id: ${modelNameSingular}.id,
${fieldDefinitions
  .filter(field => field.name !== 'id' && !field.name.includes('At'))
  .map(field => `        ${field.name}: ${modelNameSingular}.${field.name},`)
  .join('\n')}
        createdAt: ${modelNameSingular}.createdAt,
        updatedAt: ${modelNameSingular}.updatedAt,
        deletedAt: ${modelNameSingular}.deletedAt,${serializeRelations}
    });
}
`;
};

// Update errors/index.ts
const updateErrorsFile = (filePath, uppercaseName, capitalizedName) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the error code already exists
    if (content.includes(`"${uppercaseName}_NOT_FOUND"`)) {
      console.log(`Error code ${uppercaseName}_NOT_FOUND already exists in errors file.`);
      return;
    }

    // Find the ErrorCode type definition
    const errorCodePattern = /type ErrorCode =[\s\S]*?;/;
    const errorCodeMatch = content.match(errorCodePattern);

    if (errorCodeMatch) {
      // Add new error code before the closing part
      const newErrorCode = `    | "${uppercaseName}_NOT_FOUND"`;
      const replacedContent = content.replace(
        errorCodePattern,
        errorCodeMatch[0].replace(/;$/, `\n${newErrorCode}\n    ;`)
      );

      fs.writeFileSync(filePath, replacedContent);
      console.log(`Updated file: ${filePath} with new error code.`);
    } else {
      console.error(`Could not find ErrorCode type in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating errors file:`, error);
  }
};

// Update activity/index.ts
const updateActivityFile = (filePath, uppercaseName, capitalizedName) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the action already exists
    if (content.includes(`CREATE_${uppercaseName} =`)) {
      console.log(`Actions for ${capitalizedName} already exist in activity file.`);
      return;
    }

    // Find the Action enum
    const actionEnumPattern = /export enum Action {[\s\S]*?}/;
    const actionEnumMatch = content.match(actionEnumPattern);

    if (actionEnumMatch) {
      const actionsToAdd = `
    CREATE_${uppercaseName} = "CREATE_${uppercaseName}",
    UPDATE_${uppercaseName} = "UPDATE_${uppercaseName}",
    DELETE_${uppercaseName} = "DELETE_${uppercaseName}",`;

      // Add new actions before the closing brace
      const replacedContent = content.replace(
        actionEnumPattern,
        actionEnumMatch[0].replace(/}$/, `${actionsToAdd}\n  }`)
      );

      fs.writeFileSync(filePath, replacedContent);
      console.log(`Updated file: ${filePath} with new activity actions.`);
    } else {
      console.error(`Could not find Action enum in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating activity file:`, error);
  }
};

// Generate API file content
const generateApiFile = (name, capitalizedName, permission) => {
  return `import express, {NextFunction, Request, Response} from "express";
import {${capitalizedName}} from "../${name}";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace ${capitalizedName}Api {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.${permission}),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = ${capitalizedName}.listParams.parse(req.query);

                    const {data, pagination} = await ${capitalizedName}.list(filter);

                    res.status(200).json({data, pagination});
                } catch (e) {
                    return next(e);
                }
            },
        )
        .get(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.${permission}),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = ${capitalizedName}.findParams.parse(req.params);

                    const data = await ${capitalizedName}.find(params);

                    res.status(200).json({
                        data,
                    });
                } catch (e) {
                    return next(e);
                }
            },
        )
        .patch(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.${permission}),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = ${capitalizedName}.findParams.parse(req.params);
                    const data = ${capitalizedName}.updateData.parse(req.body);

                    await ${capitalizedName}.update({...params, ...data}, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .delete(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.${permission}),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = ${capitalizedName}.findParams.parse(req.params);

                    await ${capitalizedName}.remove(params, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .post(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.${permission}),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const data = ${capitalizedName}.createData.parse(req.body);

                    const id = await ${capitalizedName}.create(data, req.context);

                    res.status(201).json({id});
                } catch (e) {
                    return next(e);
                }
            },
        );
}
`;
};

// Update app.ts
const updateAppFile = (filePath, name, capitalizedName) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the route is already registered
    if (content.includes(`/${name}"`)) {
      console.log(`Route for ${name} already exists in app.ts.`);
      return;
    }

    // Add import
    const lastImport = content.lastIndexOf('import');
    const lastImportLine = content.indexOf(';', lastImport) + 1;

    const importLine = `\nimport {${capitalizedName}Api} from "./${name}";`;
    content = content.slice(0, lastImportLine) + importLine + content.slice(lastImportLine);

    // Add route
    const lastRoute = content.lastIndexOf('app.use("/');
    const lastRouteLine = content.indexOf(';', lastRoute) + 1;

    const routeLine = `\napp.use("/${name}", ${capitalizedName}Api.route);`;
    content = content.slice(0, lastRouteLine) + routeLine + content.slice(lastRouteLine);

    fs.writeFileSync(filePath, content);
    console.log(`Updated file: ${filePath} with new route.`);
  } catch (error) {
    console.error(`Error updating app.ts:`, error);
  }
};

// Update prisma schema
const updatePrismaSchema = (
  filePath,
  capitalizedName,
  modelNameSingular,
  fieldDefinitions
) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if model already exists
    if (content.includes(`model ${capitalizedName} {`)) {
      console.log(`Model ${capitalizedName} already exists in schema.prisma.`);
      return;
    }

    // Create model definition
    const modelDefinition = `
model ${capitalizedName} {
  id        String   @id @default(uuid())
${fieldDefinitions
  .filter(field => field.name !== 'id' && !field.name.includes('At'))
  .map(field => {
    if (field.isEnum && !field.isRelation) {
      return `  ${field.name}  ${capitalizedName}Type`;
    } else {
      return `  ${field.name}  String${field.isRequired ? '' : '?'}`;
    }
  })
  .join('\n')}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
${fieldDefinitions
  .filter(field => field.isRelation)
  .map(field => {
    const relationModelName = field.relationModel || capitalize(field.name);
      return `  ${field.name.replace(/Id$/, '')} ${relationModelName} @relation(fields: [${field.name}], references: [id])`;
  })
  .join('\n')}
}

${fieldDefinitions.some(field => field.isEnum && !field.isRelation) ? `
enum ${capitalizedName}Type {
${fieldDefinitions
  .filter(field => field.isEnum && !field.isRelation && field.enumValues)
  .flatMap(field => field.enumValues)
  .map(value => `  ${value}`)
  .join('\n')}
}
` : ''}
`;

    // Append model to the end of the file
    content += modelDefinition;

    fs.writeFileSync(filePath, content);
    console.log(`Updated file: ${filePath} with new model.`);
  } catch (error) {
    console.error(`Error updating schema.prisma:`, error);
  }
};

// PART 4

// Generate test file content (continued)
const generateTestFile = (testType, name, capitalizedName, modelNameSingular) => {
  const uppercaseName = name.toUpperCase();

  switch (testType) {
    case 'create':
      return `import request from 'supertest';
import {describe, expect, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {${capitalizedName}} from "../../src/${name}";

const prisma = new PrismaClient();

describe.concurrent('POST /${name}', () => {
    let adminUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with appropriate permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);
    });

    it('should create a new ${modelNameSingular} when user has appropriate permission', async ({expect}) => {
        const new${capitalizedName} = {
            // Add test data based on your model fields
            id: faker.string.uuid(),
            // Add all required fields here
        };

        const res = await request(app)
            .post('/${name}')
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .send(new${capitalizedName});

        expect(res.status).toBe(204);

        // Verify the ${modelNameSingular} was created in the database
        const created${capitalizedName} = await prisma.${name}.findFirst({
            where: { id: new${capitalizedName}.id }
        });

        expect(created${capitalizedName}).not.toBeNull();
        // Add assertions for created data fields
    });

    it('should return an error when user lacks appropriate permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const new${capitalizedName} = {
            // Add test data for all required fields
        };

        const res = await request(app)
            .post('/${name}')
            .set('Authorization', \`Bearer \${regularUser.token}\`)
            .send(new${capitalizedName});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/${name}')
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
    });
});`;

    case 'list':
      return `import request from 'supertest';
import {describe, expect, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {${capitalizedName}} from '../../src/${name}';
import {faker} from "@faker-js/faker";

const prisma = new PrismaClient();

describe('GET /${name}', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with appropriate permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create ${modelNameSingular} records for testing
        const ${name} = [];
        for (let i = 0; i < 5; i++) {
            ${name}.push(await prisma.${name}.create({
                data: {
                    // Add test data for all required fields
                }
            }));
        }
    });

    it('should allow access when user has appropriate permission', async () => {
        const res = await request(app)
            .get('/${name}')
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an error when user lacks appropriate permission', async () => {
        const res = await request(app)
            .get('/${name}')
            .set('Authorization', \`Bearer \${regularUser.token}\`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should paginate results', async () => {
        const res = await request(app)
            .get('/${name}?perPage=1&page=1')
            .set('Authorization', \`Bearer \${adminUser.token}\`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.pagination.total).toBeGreaterThan(0);
    });

    // Add tests for filtering based on your model's fields
});`;

    case 'delete':
      return `import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from "@faker-js/faker";
import {${capitalizedName}} from '../../src/${name}';

const prisma = new PrismaClient();

describe.concurrent('DELETE /${name}/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let ${modelNameSingular}ToDelete: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with appropriate permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create ${modelNameSingular} to be deleted in tests
        ${modelNameSingular}ToDelete = await prisma.${name}.create({
            data: {
                // Add test data for all required fields
            }
        });
    });

    it('should delete ${modelNameSingular} when requester has appropriate permission', async ({expect}) => {
        const res = await request(app)
            .delete(\`/${name}/\${${modelNameSingular}ToDelete.id}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`);

        expect(res.status).toBe(204);

        // Verify the ${modelNameSingular} was soft deleted
        const deleted${capitalizedName} = await prisma.${name}.findUnique({
            where: {id: ${modelNameSingular}ToDelete.id}
        });

        expect(deleted${capitalizedName}).not.toBeNull();
        expect(deleted${capitalizedName}?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks appropriate permission', async ({expect}) => {
        // Create another ${modelNameSingular} to attempt to delete
        const another${capitalizedName} = await prisma.${name}.create({
            data: {
                // Add test data for all required fields
            }
        });

        const res = await request(app)
            .delete(\`/${name}/\${another${capitalizedName}.id}\`)
            .set('Authorization', \`Bearer \${regularUser.token}\`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify ${modelNameSingular} wasn't deleted
        const ${modelNameSingular} = await prisma.${name}.findUnique({
            where: {id: another${capitalizedName}.id}
        });

        expect(${modelNameSingular}).not.toBeNull();
        expect(${modelNameSingular}?.deletedAt).toBeNull();
    });

    it('should return an error when ${modelNameSingular} ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(\`/${name}/\${nonExistingId}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('message', '${capitalizedName} not found.');
    });

    it('should record an activity log entry when ${modelNameSingular} is deleted', async ({expect}) => {
        // Create ${modelNameSingular} to delete
        const ${modelNameSingular}ForActivity = await prisma.${name}.create({
            data: {
                // Add test data for all required fields
            }
        });

        await request(app)
            .delete(\`/${name}/\${${modelNameSingular}ForActivity.id}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`);

        // Wait for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_${uppercaseName}',
                    subjectId: ${modelNameSingular}ForActivity.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // If found already, break out of the loop
            if (activityLog) {
                break;
            }

            // Wait 100ms before trying again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        expect(activityLog).not.toBeNull();
        expect(activityLog?.subjectId).toBe(${modelNameSingular}ForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});`;

    case 'patch':
      return `import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {${capitalizedName}} from '../../src/${name}';

const prisma = new PrismaClient();

describe.concurrent('PATCH /${name}/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let ${modelNameSingular}ToUpdate: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with appropriate permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create ${modelNameSingular} to update in tests
        ${modelNameSingular}ToUpdate = await prisma.${name}.create({
            data: {
                // Add test data for all required fields
            }
        });
    });

    it('should update ${modelNameSingular} when requester has appropriate permission', async ({expect}) => {
        const updateData = {
            // Add fields to update
        };

        const res = await request(app)
            .patch(\`/${name}/\${${modelNameSingular}ToUpdate.id}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the ${modelNameSingular} was updated
        const updated${capitalizedName} = await prisma.${name}.findUnique({
            where: {id: ${modelNameSingular}ToUpdate.id}
        });

        expect(updated${capitalizedName}).not.toBeNull();
        // Add assertions for updated fields
    });

    it('should return an error when user lacks appropriate permission', async ({expect}) => {
        const updateData = {
            // Add update data
        };

        const res = await request(app)
            .patch(\`/${name}/\${${modelNameSingular}ToUpdate.id}\`)
            .set('Authorization', \`Bearer \${regularUser.token}\`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when ${modelNameSingular} ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(\`/${name}/\${nonExistingId}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .send({ /* some valid data */ });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', '${capitalizedName} not found.');
    });

    it('should record an activity log entry when ${modelNameSingular} is updated', async ({expect}) => {
        const ${modelNameSingular}ForActivity = await prisma.${name}.create({
            data: {
                // Add test data for all required fields
            }
        });

        await request(app)
            .patch(\`/${name}/\${${modelNameSingular}ForActivity.id}\`)
            .set('Authorization', \`Bearer \${adminUser.token}\`)
            .send({ /* update data */ });

        // Wait for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 1000; // 1 second
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_${uppercaseName}',
                    subjectId: ${modelNameSingular}ForActivity.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // If found already, break out of the loop
            if (activityLog) {
                break;
            }

            // Wait 100ms before trying again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        expect(activityLog).not.toBeNull();
        expect(activityLog?.subjectId).toBe(${modelNameSingular}ForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});`;

    default:
      return '';
  }
};

// PART 5

// Main function to run the API endpoint generator
const run = async () => {
  try {
    console.log('🚀 Welcome to the API Endpoint Generator 🚀\n');

    const name = await askQuestion('Enter the endpoint name (plural, e.g. "reports")');
    const entityName = singularize(capitalize(name));
    const modelNameSingular = singularize(name);
    const modelNamePlural = name;
    const uppercaseName = name.toUpperCase();
    const capitalizedName = capitalize(name);
    const capitalizedNamePlural = capitalize(modelNamePlural);

    console.log('\nDefine fields for your model:');
    const permission = await askQuestion('Enter the permission needed to access this endpoint (e.g. VIEW_REPORTS)');

    const fieldDefinitions = [];
    let addMoreFields = true;

    while (addMoreFields) {
      const fieldName = await askQuestion('\nField name');
      const fieldType = await askQuestion('Field type (string, number, boolean, date, uuid, enum)');
      const isRequired = (await askQuestion('Is this field required? (y/n)')).toLowerCase() === 'y';

      let isEnum = false;
      let enumValues = [];
      let isRelation = false;
      let relationModel = null;

      if (fieldType === 'enum') {
        isEnum = true;
        const enumValueStr = await askQuestion('Enter enum values (comma separated)');
        enumValues = enumValueStr.split(',').map(v => v.trim().toUpperCase());

        const isEnumRelation = (await askQuestion('Is this enum from another model? (y/n)')).toLowerCase() === 'y';
        if (isEnumRelation) {
          isRelation = true;
          relationModel = await askQuestion('Enter the other model name (e.g. TherapyServices)');
        }
      } else if (fieldName.endsWith('Id')) {
        isRelation = true;
        relationModel = await askQuestion('Enter the related model name (e.g. School)');
      }

      fieldDefinitions.push({
        name: fieldName,
        type: fieldType,
        isEnum,
        enumValues,
        isRequired,
        isRelation,
        relationModel
      });

      const more = await askQuestion('Add another field? (y/n)');
      addMoreFields = more.toLowerCase() === 'y';
    }

    const runCommands = (await askQuestion('\nDo you want to run the Prisma and API generation commands? (y/n)')).toLowerCase() === 'y';

    // 1. Create index.ts file in src/{name}
    const indexTsPath = path.join(process.cwd(), 'backend', 'src', name, 'index.ts');
    const indexTsContent = generateIndexTs(
        name,
        entityName,
        capitalizedName,
        modelNameSingular,
        capitalizedNamePlural,
        fieldDefinitions,
        uppercaseName
    );
    createOrUpdateFile(indexTsPath, indexTsContent);

    // 2. Update errors/index.ts
    const errorsPath = path.join(process.cwd(), 'backend', 'src', 'errors', 'index.ts');
    updateErrorsFile(errorsPath, uppercaseName, capitalizedName);

    // 3. Update activity/index.ts
    const activityPath = path.join(process.cwd(), 'backend', 'src', 'activity', 'index.ts');
    updateActivityFile(activityPath, uppercaseName, capitalizedName);

    // 4. Create src/api/{name}.ts
    const apiFilePath = path.join(process.cwd(), 'backend', 'src', 'api', `${name}.ts`);
    const apiFileContent = generateApiFile(name, capitalizedName, permission);
    createOrUpdateFile(apiFilePath, apiFileContent);

    // 5. Update src/api/app.ts
    const appFilePath = path.join(process.cwd(), 'backend', 'src', 'api', 'app.ts');
    updateAppFile(appFilePath, name, capitalizedName);

    // 6. Update prisma/schema.prisma
    const prismaSchemaPath = path.join(process.cwd(), 'backend', 'prisma', 'schema.prisma');
    updatePrismaSchema(prismaSchemaPath, capitalizedName, modelNameSingular, fieldDefinitions);

    // 7. Update prisma/seeders/seed.ts - This would be more complex and depend on your seed data structure
    // Skipped for now, as it's highly specific to your project

    // 8. Create src/openapi/{name}.ts
    const openapiFilePath = path.join(process.cwd(), 'backend', 'src', 'openapi', `${name}.ts`);
    const openapiFileContent = generateOpenApiFile(name, capitalizedName);
    createOrUpdateFile(openapiFilePath, openapiFileContent);

    // 9. Update src/openapi/generate.ts
    const generateFilePath = path.join(process.cwd(), 'backend', 'src', 'openapi', 'generate.ts');
    updateOpenApiGenerateFile(generateFilePath, name, capitalizedName);

    // 10. Create test files in the backend/__tests__/{name} directory
    const testDirPath = path.join(process.cwd(), 'backend', '__tests__', name);
    ensureDirectoryExists(testDirPath);

    const testFiles = ['create', 'list', 'delete', 'patch'];
    testFiles.forEach(testType => {
      const testFilePath = path.join(testDirPath, `${testType}.test.ts`);
      const testFileContent = generateTestFile(testType, name, capitalizedName, modelNameSingular);
      createOrUpdateFile(testFilePath, testFileContent);
    });

    // 11. Run commands if specified
    if (runCommands) {
      try {
        console.log('\nRunning Prisma migrate command...');
        execSync(`cd backend && npx prisma migrate dev --name add_${name}`, { stdio: 'inherit' });

        console.log('\nRunning Prisma generate command...');
        execSync('cd backend && npx prisma generate', { stdio: 'inherit' });

        console.log('\nRunning API generation command...');
        execSync('npm run gen-api', { stdio: 'inherit' });

        console.log('\nAll commands executed successfully!');
      } catch (error) {
        console.error('Error running commands:', error);
      }
    }

    console.log(`\n✅ Endpoint "${name}" has been successfully generated!`);

    rl.close();
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
  }
};

// Run the generator
run();

/**
 invoice_id integer [unique, primary key]
 provider_id integer
 student_id integer
 therapy_service_id integer
 amount decimal
 status enum (pending,paid,declined)
 date_issued date
 created_at timestamp
 updated_at timestamp
 */




